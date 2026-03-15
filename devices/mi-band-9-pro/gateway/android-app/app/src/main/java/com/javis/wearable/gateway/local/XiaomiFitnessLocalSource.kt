package com.javis.wearable.gateway.local

import com.javis.wearable.gateway.health.HealthMetrics

data class XiaomiProviderProbeResult(
    val status: String,
    val detail: String? = null
)

class XiaomiFitnessLocalSource(
    private val providerProbe: suspend () -> XiaomiProviderProbeResult = {
        XiaomiProviderProbeResult(status = "not_checked")
    },
    private val logReader: suspend () -> List<String> = { emptyList() },
    private val parser: XiaomiFitnessLogParser = XiaomiFitnessLogParser()
) : GatewayMetricsSource {
    override suspend fun readLatestMetrics(): HealthMetrics {
        val probeResult = runCatching { providerProbe() }
            .getOrElse { error ->
                XiaomiProviderProbeResult(
                    status = "probe_error:${error.javaClass.simpleName}",
                    detail = error.message
                )
            }

        val logResult = runCatching { logReader() }
        val parsed = logResult
            .map(parser::parse)
            .getOrElse { HealthMetrics() }

        val logStatus = when {
            logResult.isFailure -> "inaccessible:${logResult.exceptionOrNull()!!.javaClass.simpleName}"
            parsed.hasAnyMetric() -> "ok"
            else -> "no_structured_metrics"
        }

        return parsed.copy(
            available = parsed.hasAnyMetric(),
            permissionGranted = parsed.hasAnyMetric(),
            statusMessage = if (parsed.hasAnyMetric()) parsed.statusMessage else "no_local_data",
            debugInfo = buildMap {
                putAll(parsed.debugInfo)
                put("xiaomi_provider_status", probeResult.status)
                probeResult.detail?.let { put("xiaomi_provider_probe", it) }
                put("xiaomi_log_status", logStatus)
            }
        )
    }
}

class CompositeMetricsSource(
    private val primary: GatewayMetricsSource,
    private val fallback: GatewayMetricsSource
) : GatewayMetricsSource {
    override suspend fun readLatestMetrics(): HealthMetrics {
        val primaryMetrics = primary.readLatestMetrics()
        val fallbackMetrics = fallback.readLatestMetrics()
        return primaryMetrics.mergeMissingFrom(fallbackMetrics)
    }
}
