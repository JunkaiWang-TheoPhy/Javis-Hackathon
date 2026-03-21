package com.javis.wearable.gateway.health

import java.time.Instant

object HealthConnectDiagnostics {
    fun buildDebugInfo(
        status: String,
        lookbackDays: Int,
        heartRateRecordCount: Int = 0,
        latestHeartRateAt: Instant? = null,
        spo2RecordCount: Int = 0,
        latestSpo2At: Instant? = null,
        stepRecordCount: Int = 0,
        latestStepsAt: Instant? = null,
        totalSteps: Int? = null
    ): Map<String, String> {
        return buildMap {
            put("health_connect_status", status)
            put("health_connect_lookback_days", lookbackDays.toString())
            put("health_connect_heart_rate_record_count", heartRateRecordCount.toString())
            latestHeartRateAt?.let { put("health_connect_latest_heart_rate_at", it.toString()) }
            put("health_connect_spo2_record_count", spo2RecordCount.toString())
            latestSpo2At?.let { put("health_connect_latest_spo2_at", it.toString()) }
            put("health_connect_steps_record_count", stepRecordCount.toString())
            latestStepsAt?.let { put("health_connect_latest_steps_at", it.toString()) }
            totalSteps?.let { put("health_connect_steps_total", it.toString()) }
        }
    }
}
