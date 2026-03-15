package com.javis.wearable.gateway.local

import com.javis.wearable.gateway.health.HealthMetrics
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant

class XiaomiFitnessLocalSourceTest {
    @Test
    fun `local source uses parsed Xiaomi log data when provider probe has no data`() = runBlocking {
        val source = XiaomiFitnessLocalSource(
            providerProbe = {
                XiaomiProviderProbeResult(
                    status = "no_provider_deploy",
                    detail = "content://com.mi.health.provider.main/steps"
                )
            },
            logReader = {
                listOf(
                    "2026-03-15 00:29:11.306|3.53.1|I|fitness_16964_17499|[HomeDataRepository] STEP - (DailyStepReport(time=1773504000, time = 2026-03-15 00:00:00, tag='home', steps=172, distance=99, calories=7, minStartTime=1773504840, maxEndTime=1773505500, avgStep=172, avgDis=99, active=null, stepRecords=[StepRecord{time = 2026-03-15 00:00:00, steps = 172, distance = 99, calories = 7}]))",
                    "2026-03-15 01:12:11.841|3.53.1|I|fitness_16964_17499|[HomeDataRepository] SPO2 - (DailySpo2Report(time=1773507600, time=2026-03-15 01:00:00, tag='home', avgSpo2=97, maxSpo2=99, minSpo2=95, lackTimes=0, spo2Records=[], abnormalRecords=null, latestSpoRecord=Spo2Record(time=1773508320, value=98)))"
                )
            }
        )

        val metrics = source.readLatestMetrics()

        assertEquals(172, metrics.steps)
        assertEquals(98, metrics.spo2Percent)
        assertEquals("xiaomi_fitness_log", metrics.stepsSource)
        assertEquals("xiaomi_fitness_log", metrics.spo2Source)
        assertEquals("no_provider_deploy", metrics.debugInfo["xiaomi_provider_status"])
        assertEquals("ok", metrics.debugInfo["xiaomi_log_status"])
    }

    @Test
    fun `local source reports inaccessible Xiaomi log directory`() = runBlocking {
        val source = XiaomiFitnessLocalSource(
            providerProbe = { XiaomiProviderProbeResult(status = "root_query_empty", detail = "content://com.mi.health.provider.main") },
            logReader = { throw IllegalStateException("permission denied") }
        )

        val metrics = source.readLatestMetrics()

        assertFalse(metrics.hasAnyMetric())
        assertEquals("no_local_data", metrics.statusMessage)
        assertEquals("root_query_empty", metrics.debugInfo["xiaomi_provider_status"])
        assertEquals("inaccessible:IllegalStateException", metrics.debugInfo["xiaomi_log_status"])
    }

    @Test
    fun `composite source fills missing metrics from fallback`() = runBlocking {
        val composite = CompositeMetricsSource(
            primary = object : GatewayMetricsSource {
                override suspend fun readLatestMetrics(): HealthMetrics {
                    return HealthMetrics(
                        steps = 172,
                        stepsSource = "xiaomi_fitness_log",
                        sourceTimestamp = Instant.parse("2026-03-14T16:25:00Z"),
                        available = true,
                        permissionGranted = true,
                        statusMessage = "ok",
                        debugInfo = mapOf("xiaomi_local_status" to "ok")
                    )
                }
            },
            fallback = object : GatewayMetricsSource {
                override suspend fun readLatestMetrics(): HealthMetrics {
                    return HealthMetrics(
                        heartRateBpm = 72,
                        spo2Percent = 98,
                        heartRateSource = "health_connect",
                        spo2Source = "health_connect",
                        sourceTimestamp = Instant.parse("2026-03-14T16:30:00Z"),
                        available = true,
                        permissionGranted = true,
                        statusMessage = "ok",
                        debugInfo = mapOf("health_connect_status" to "ok")
                    )
                }
            }
        )

        val metrics = composite.readLatestMetrics()

        assertEquals(72, metrics.heartRateBpm)
        assertEquals(98, metrics.spo2Percent)
        assertEquals(172, metrics.steps)
        assertEquals("health_connect", metrics.heartRateSource)
        assertEquals("health_connect", metrics.spo2Source)
        assertEquals("xiaomi_fitness_log", metrics.stepsSource)
        assertTrue(metrics.debugInfo.containsKey("xiaomi_local_status"))
        assertTrue(metrics.debugInfo.containsKey("health_connect_status"))
    }
}
