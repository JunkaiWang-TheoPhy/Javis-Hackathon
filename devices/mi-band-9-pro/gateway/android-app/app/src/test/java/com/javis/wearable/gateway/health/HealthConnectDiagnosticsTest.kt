package com.javis.wearable.gateway.health

import com.javis.wearable.gateway.BandConfig
import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Test

class HealthConnectDiagnosticsTest {
    @Test
    fun `band config defaults health connect lookback to seven days`() {
        assertEquals(7, BandConfig.healthConnectLookbackDays)
    }

    @Test
    fun `debug info includes lookback window counts and timestamps`() {
        val debugInfo = HealthConnectDiagnostics.buildDebugInfo(
            status = "ok",
            lookbackDays = 7,
            heartRateRecordCount = 3,
            latestHeartRateAt = Instant.parse("2026-03-21T03:05:00Z"),
            spo2RecordCount = 2,
            latestSpo2At = Instant.parse("2026-03-21T03:04:00Z"),
            stepRecordCount = 4,
            latestStepsAt = Instant.parse("2026-03-21T03:06:00Z"),
            totalSteps = 1234
        )

        assertEquals("ok", debugInfo["health_connect_status"])
        assertEquals("7", debugInfo["health_connect_lookback_days"])
        assertEquals("3", debugInfo["health_connect_heart_rate_record_count"])
        assertEquals("2026-03-21T03:05:00Z", debugInfo["health_connect_latest_heart_rate_at"])
        assertEquals("2", debugInfo["health_connect_spo2_record_count"])
        assertEquals("2026-03-21T03:04:00Z", debugInfo["health_connect_latest_spo2_at"])
        assertEquals("4", debugInfo["health_connect_steps_record_count"])
        assertEquals("2026-03-21T03:06:00Z", debugInfo["health_connect_latest_steps_at"])
        assertEquals("1234", debugInfo["health_connect_steps_total"])
    }
}
