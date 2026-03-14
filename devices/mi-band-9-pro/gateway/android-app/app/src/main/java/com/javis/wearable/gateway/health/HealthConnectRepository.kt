package com.javis.wearable.gateway.health

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
    val providerPackage: String = HealthPermissions.providerPackageName,
    val message: String
)

data class HealthMetrics(
    val heartRateBpm: Int? = null,
    val spo2Percent: Int? = null,
    val steps: Int? = null,
    val sourceTimestamp: Instant? = null,
    val sdkStatus: Int = HealthConnectClient.SDK_UNAVAILABLE,
    val available: Boolean = false,
    val permissionGranted: Boolean = false,
    val statusMessage: String = "sdk_unavailable"
)

class HealthConnectRepository(
    private val context: Context,
    private val clock: Clock = Clock.systemDefaultZone()
) {
    fun availability(): HealthAvailability {
        val sdkStatus = HealthConnectClient.sdkStatus(context)
        return HealthAvailability(
            sdkStatus = sdkStatus,
            available = sdkStatus == HealthConnectClient.SDK_AVAILABLE,
            message = statusMessage(sdkStatus)
        )
    }

    suspend fun grantedPermissions(): Set<String> {
        val client = clientOrNull() ?: return emptySet()
        return client.permissionController.getGrantedPermissions()
    }

    suspend fun readLatestMetrics(): HealthMetrics {
        val availability = availability()
        if (!availability.available) {
            return HealthMetrics(
                sdkStatus = availability.sdkStatus,
                available = false,
                permissionGranted = false,
                statusMessage = availability.message
            )
        }

        val client = HealthConnectClient.getOrCreate(context)
        val grantedPermissions = client.permissionController.getGrantedPermissions()
        if (!HealthPermissions.hasAll(grantedPermissions)) {
            return HealthMetrics(
                sdkStatus = availability.sdkStatus,
                available = true,
                permissionGranted = false,
                statusMessage = "missing_permissions"
            )
        }

        return runCatching {
            val endTime = Instant.now(clock)
            val windowStart = endTime.minus(1, ChronoUnit.DAYS)

            val heartRate = readLatestHeartRate(client, windowStart, endTime)
            val spo2 = readLatestSpo2(client, windowStart, endTime)
            val steps = readSteps(client, windowStart, endTime)
            val sourceTimestamp = listOfNotNull(heartRate?.first, spo2?.first, steps?.first).maxOrNull()

            HealthMetrics(
                heartRateBpm = heartRate?.second,
                spo2Percent = spo2?.second,
                steps = steps?.second,
                sourceTimestamp = sourceTimestamp,
                sdkStatus = availability.sdkStatus,
                available = true,
                permissionGranted = true,
                statusMessage = "ok"
            )
        }.getOrElse { error ->
            HealthMetrics(
                sdkStatus = availability.sdkStatus,
                available = true,
                permissionGranted = true,
                statusMessage = "error:${error.javaClass.simpleName}"
            )
        }
    }

    private fun clientOrNull(): HealthConnectClient? {
        return if (HealthConnectClient.sdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
            HealthConnectClient.getOrCreate(context)
        } else {
            null
        }
    }

    private suspend fun readLatestHeartRate(
        client: HealthConnectClient,
        startTime: Instant,
        endTime: Instant
    ): Pair<Instant, Int>? {
        val response = client.readRecords(
            ReadRecordsRequest(
                recordType = HeartRateRecord::class,
                timeRangeFilter = TimeRangeFilter.between(startTime, endTime),
                ascendingOrder = false,
                pageSize = 10
            )
        )

        val latestSample = response.records
            .asSequence()
            .flatMap { it.samples.asSequence() }
            .maxByOrNull { it.time }

        return latestSample?.let { it.time to it.beatsPerMinute.toInt() }
    }

    private suspend fun readLatestSpo2(
        client: HealthConnectClient,
        startTime: Instant,
        endTime: Instant
    ): Pair<Instant, Int>? {
        val response = client.readRecords(
            ReadRecordsRequest(
                recordType = OxygenSaturationRecord::class,
                timeRangeFilter = TimeRangeFilter.between(startTime, endTime),
                ascendingOrder = false,
                pageSize = 10
            )
        )

        val latestRecord = response.records.maxByOrNull { it.time }
        return latestRecord?.let { it.time to it.percentage.value.roundToInt() }
    }

    private suspend fun readSteps(
        client: HealthConnectClient,
        startTime: Instant,
        endTime: Instant
    ): Pair<Instant, Int>? {
        val aggregateResult = client.aggregate(
            AggregateRequest(
                metrics = setOf(StepsRecord.COUNT_TOTAL),
                timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
            )
        )
        val totalSteps = aggregateResult[StepsRecord.COUNT_TOTAL]?.toInt() ?: return null
        return endTime to totalSteps
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
