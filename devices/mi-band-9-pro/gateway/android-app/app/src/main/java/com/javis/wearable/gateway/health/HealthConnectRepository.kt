package com.javis.wearable.gateway.health

import com.javis.wearable.gateway.BandConfig
import android.content.Intent
import android.content.pm.PackageManager
import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Clock
import java.time.Instant
import java.time.temporal.ChronoUnit
import kotlin.math.roundToInt

data class HealthAvailability(
    val sdkStatus: Int,
    val available: Boolean,
    val providerPackage: String = HealthPermissions.defaultProviderPackageName,
    val message: String
)

data class HealthMetrics(
    val heartRateBpm: Int? = null,
    val spo2Percent: Int? = null,
    val steps: Int? = null,
    val sourceTimestamp: Instant? = null,
    val heartRateSource: String? = null,
    val spo2Source: String? = null,
    val stepsSource: String? = null,
    val sdkStatus: Int = HealthConnectClient.SDK_UNAVAILABLE,
    val available: Boolean = false,
    val permissionGranted: Boolean = false,
    val statusMessage: String = "sdk_unavailable",
    val debugInfo: Map<String, String> = emptyMap()
) {
    fun hasAnyMetric(): Boolean {
        return heartRateBpm != null || spo2Percent != null || steps != null
    }

    fun mergeMissingFrom(fallback: HealthMetrics): HealthMetrics {
        return copy(
            heartRateBpm = heartRateBpm ?: fallback.heartRateBpm,
            spo2Percent = spo2Percent ?: fallback.spo2Percent,
            steps = steps ?: fallback.steps,
            sourceTimestamp = listOfNotNull(sourceTimestamp, fallback.sourceTimestamp).maxOrNull(),
            heartRateSource = heartRateSource ?: fallback.heartRateSource,
            spo2Source = spo2Source ?: fallback.spo2Source,
            stepsSource = stepsSource ?: fallback.stepsSource,
            sdkStatus = if (sdkStatus != HealthConnectClient.SDK_UNAVAILABLE) sdkStatus else fallback.sdkStatus,
            available = available || fallback.available,
            permissionGranted = permissionGranted || fallback.permissionGranted,
            statusMessage = when {
                hasAnyMetric() -> statusMessage
                fallback.hasAnyMetric() -> fallback.statusMessage
                else -> statusMessage
            },
            debugInfo = debugInfo + fallback.debugInfo
        )
    }
}

private data class MetricReadResult<T>(
    val latestAt: Instant? = null,
    val value: T? = null,
    val recordCount: Int = 0
)

class HealthConnectRepository(
    private val context: Context,
    private val clock: Clock = Clock.systemDefaultZone()
) {
    fun availability(): HealthAvailability {
        val providerSelection = resolveProvider()
        return HealthAvailability(
            sdkStatus = providerSelection.sdkStatus,
            available = isReadable(providerSelection),
            providerPackage = providerSelection.packageName,
            message = availabilityMessage(providerSelection)
        )
    }

    suspend fun grantedPermissions(): Set<String> {
        val client = clientOrNull() ?: return emptySet()
        return client.permissionController.getGrantedPermissions()
    }

    suspend fun readLatestMetrics(): HealthMetrics {
        val lookbackDays = BandConfig.healthConnectLookbackDays.coerceAtLeast(1)
        val availability = availability()
        if (!availability.available) {
            return HealthMetrics(
                sdkStatus = availability.sdkStatus,
                available = false,
                permissionGranted = false,
                statusMessage = availability.message,
                debugInfo = HealthConnectDiagnostics.buildDebugInfo(
                    status = availability.message,
                    lookbackDays = lookbackDays
                )
            )
        }

        val client = createClient(availability.providerPackage)
        val grantedPermissions = client.permissionController.getGrantedPermissions()
        if (!HealthPermissions.hasAll(grantedPermissions)) {
            return HealthMetrics(
                sdkStatus = availability.sdkStatus,
                available = true,
                permissionGranted = false,
                statusMessage = "missing_permissions",
                debugInfo = HealthConnectDiagnostics.buildDebugInfo(
                    status = "missing_permissions",
                    lookbackDays = lookbackDays
                )
            )
        }

        return runCatching {
            val endTime = Instant.now(clock)
            val windowStart = endTime.minus(lookbackDays.toLong(), ChronoUnit.DAYS)

            val heartRate = readLatestHeartRate(client, windowStart, endTime)
            val spo2 = readLatestSpo2(client, windowStart, endTime)
            val steps = readSteps(client, windowStart, endTime)
            val sourceTimestamp = listOfNotNull(
                heartRate.latestAt,
                spo2.latestAt,
                steps.latestAt
            ).maxOrNull()

            HealthMetrics(
                heartRateBpm = heartRate.value,
                spo2Percent = spo2.value,
                steps = steps.value,
                sourceTimestamp = sourceTimestamp,
                heartRateSource = heartRate.value?.let { "health_connect" },
                spo2Source = spo2.value?.let { "health_connect" },
                stepsSource = steps.value?.let { "health_connect" },
                sdkStatus = availability.sdkStatus,
                available = true,
                permissionGranted = true,
                statusMessage = "ok",
                debugInfo = HealthConnectDiagnostics.buildDebugInfo(
                    status = "ok",
                    lookbackDays = lookbackDays,
                    heartRateRecordCount = heartRate.recordCount,
                    latestHeartRateAt = heartRate.latestAt,
                    spo2RecordCount = spo2.recordCount,
                    latestSpo2At = spo2.latestAt,
                    stepRecordCount = steps.recordCount,
                    latestStepsAt = steps.latestAt,
                    totalSteps = steps.value
                )
            )
        }.getOrElse { error ->
            HealthMetrics(
                sdkStatus = availability.sdkStatus,
                available = true,
                permissionGranted = true,
                statusMessage = "error:${error.javaClass.simpleName}",
                debugInfo = HealthConnectDiagnostics.buildDebugInfo(
                    status = "error:${error.javaClass.simpleName}",
                    lookbackDays = lookbackDays
                )
            )
        }
    }

    private fun clientOrNull(): HealthConnectClient? {
        val availability = availability()
        return if (availability.available) {
            createClient(availability.providerPackage)
        } else {
            null
        }
    }

    private fun resolveProvider(): HealthConnectProviderSelection {
        val googleStatus = HealthConnectClient.sdkStatus(
            context,
            HealthConnectCompat.googleProviderPackage
        )
        if (googleStatus == HealthConnectClient.SDK_AVAILABLE) {
            return HealthConnectProviderSelection(
                packageName = HealthConnectCompat.googleProviderPackage,
                sdkStatus = googleStatus
            )
        }

        val xiaomiStatus = xiaomiProviderStatus()
        if (xiaomiStatus == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
            return HealthConnectProviderSelection(
                packageName = HealthConnectCompat.xiaomiProviderPackage,
                sdkStatus = xiaomiStatus
            )
        }

        return HealthConnectProviderSelection(
            packageName = HealthConnectCompat.googleProviderPackage,
            sdkStatus = googleStatus
        )
    }

    private fun xiaomiProviderStatus(): Int {
        if (!isPackageInstalled(HealthConnectCompat.xiaomiProviderPackage)) {
            return HealthConnectClient.SDK_UNAVAILABLE
        }

        return if (
            hasBindableService(
                packageName = HealthConnectCompat.xiaomiProviderPackage,
                bindAction = HealthConnectCompat.xiaomiPlatformBindAction
            )
        ) {
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
        } else {
            HealthConnectClient.SDK_UNAVAILABLE
        }
    }

    private fun createClient(providerPackage: String): HealthConnectClient {
        return HealthConnectClient.getOrCreate(context, providerPackage)
    }

    private fun isPackageInstalled(packageName: String): Boolean {
        return try {
            context.packageManager.getPackageInfo(packageName, 0)
            true
        } catch (_: PackageManager.NameNotFoundException) {
            false
        }
    }

    private fun hasBindableService(packageName: String, bindAction: String): Boolean {
        val bindIntent = Intent(bindAction).setPackage(packageName)
        return context.packageManager.queryIntentServices(bindIntent, 0).isNotEmpty()
    }

    private fun isReadable(providerSelection: HealthConnectProviderSelection): Boolean {
        return providerSelection.packageName != HealthConnectCompat.xiaomiProviderPackage &&
            providerSelection.sdkStatus == HealthConnectClient.SDK_AVAILABLE
    }

    private fun availabilityMessage(providerSelection: HealthConnectProviderSelection): String {
        return if (providerSelection.packageName == HealthConnectCompat.xiaomiProviderPackage &&
            providerSelection.sdkStatus == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
        ) {
            "xiaomi_provider_incompatible_interface"
        } else {
            statusMessage(providerSelection.sdkStatus)
        }
    }

    private suspend fun readLatestHeartRate(
        client: HealthConnectClient,
        startTime: Instant,
        endTime: Instant
    ): MetricReadResult<Int> {
        val response = client.readRecords(
            ReadRecordsRequest(
                recordType = HeartRateRecord::class,
                timeRangeFilter = TimeRangeFilter.between(startTime, endTime),
                ascendingOrder = false,
                pageSize = 10
            )
        )

        val samples = response.records
            .asSequence()
            .flatMap { it.samples.asSequence() }
            .toList()
        val latestSample = samples.maxByOrNull { it.time }

        return MetricReadResult(
            latestAt = latestSample?.time,
            value = latestSample?.beatsPerMinute?.toInt(),
            recordCount = samples.size
        )
    }

    private suspend fun readLatestSpo2(
        client: HealthConnectClient,
        startTime: Instant,
        endTime: Instant
    ): MetricReadResult<Int> {
        val response = client.readRecords(
            ReadRecordsRequest(
                recordType = OxygenSaturationRecord::class,
                timeRangeFilter = TimeRangeFilter.between(startTime, endTime),
                ascendingOrder = false,
                pageSize = 10
            )
        )

        val latestRecord = response.records.maxByOrNull { it.time }
        return MetricReadResult(
            latestAt = latestRecord?.time,
            value = latestRecord?.percentage?.value?.roundToInt(),
            recordCount = response.records.size
        )
    }

    private suspend fun readSteps(
        client: HealthConnectClient,
        startTime: Instant,
        endTime: Instant
    ): MetricReadResult<Int> {
        val response = client.readRecords(
            ReadRecordsRequest(
                recordType = StepsRecord::class,
                timeRangeFilter = TimeRangeFilter.between(startTime, endTime),
                ascendingOrder = false,
                pageSize = 500
            )
        )
        val aggregateResult = client.aggregate(
            AggregateRequest(
                metrics = setOf(StepsRecord.COUNT_TOTAL),
                timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
            )
        )
        val totalSteps = aggregateResult[StepsRecord.COUNT_TOTAL]?.toInt()
        val latestRecord = response.records.maxByOrNull { it.endTime }
        return MetricReadResult(
            latestAt = latestRecord?.endTime,
            value = totalSteps,
            recordCount = response.records.size
        )
    }

    companion object {
        fun statusMessage(sdkStatus: Int): String {
            return when (sdkStatus) {
                HealthConnectClient.SDK_AVAILABLE -> "available"
                HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> {
                    "provider_update_required"
                }
                HealthConnectClient.SDK_UNAVAILABLE -> "sdk_unavailable"
                else -> "unknown($sdkStatus)"
            }
        }
    }
}
