package com.javis.wearable.gateway.local

import com.javis.wearable.gateway.health.HealthMetrics

fun interface GatewayMetricsSource {
    suspend fun readLatestMetrics(): HealthMetrics
}
