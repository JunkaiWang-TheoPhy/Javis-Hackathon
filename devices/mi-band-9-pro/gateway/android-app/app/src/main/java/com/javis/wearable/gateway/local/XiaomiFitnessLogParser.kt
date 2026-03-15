package com.javis.wearable.gateway.local

import com.javis.wearable.gateway.health.HealthMetrics
import java.time.Instant

class XiaomiFitnessLogParser {
    fun parse(lines: List<String>): HealthMetrics {
        val latestStep = lines
            .asReversed()
            .firstNotNullOfOrNull(::parseStepLine)

        val latestSpo2 = lines
            .asReversed()
            .firstNotNullOfOrNull(::parseSpo2Line)

        return HealthMetrics(
            spo2Percent = latestSpo2?.value,
            steps = latestStep?.value,
            sourceTimestamp = listOfNotNull(latestStep?.timestamp, latestSpo2?.timestamp).maxOrNull(),
            spo2Source = latestSpo2?.let { SOURCE_NAME },
            stepsSource = latestStep?.let { SOURCE_NAME },
            available = latestStep != null || latestSpo2 != null,
            permissionGranted = latestStep != null || latestSpo2 != null,
            statusMessage = if (latestStep != null || latestSpo2 != null) "ok" else "no_structured_metrics"
        )
    }

    private fun parseStepLine(line: String): ParsedMetric? {
        if (!line.contains("DailyStepReport(")) {
            return null
        }

        val steps = STEP_VALUE.find(line)?.groupValues?.get(1)?.toIntOrNull() ?: return null
        val timestamp = STEP_TIMESTAMP.find(line)?.groupValues?.get(1)?.toLongOrNull()
            ?: return null
        return ParsedMetric(value = steps, timestamp = Instant.ofEpochSecond(timestamp))
    }

    private fun parseSpo2Line(line: String): ParsedMetric? {
        if (!line.contains("DailySpo2Report(")) {
            return null
        }

        val explicitValue = SPO2_LATEST_VALUE.find(line)?.groupValues?.get(1)?.toIntOrNull()
        val fallbackValue = SPO2_AVERAGE_VALUE.find(line)?.groupValues?.get(1)?.toIntOrNull()
        val value = explicitValue ?: fallbackValue
        if (value == null || value <= 0) {
            return null
        }

        val explicitTimestamp = SPO2_LATEST_TIME.find(line)?.groupValues?.get(1)?.toLongOrNull()
        val fallbackTimestamp = SPO2_REPORT_TIME.find(line)?.groupValues?.get(1)?.toLongOrNull()
        val timestamp = explicitTimestamp ?: fallbackTimestamp ?: return null
        return ParsedMetric(value = value, timestamp = Instant.ofEpochSecond(timestamp))
    }

    private data class ParsedMetric(
        val value: Int,
        val timestamp: Instant
    )

    companion object {
        private const val SOURCE_NAME = "xiaomi_fitness_log"
        private val STEP_VALUE = Regex("""DailyStepReport\(.*?\bsteps=(\d+)""")
        private val STEP_TIMESTAMP = Regex("""\bmaxEndTime=(\d+)""")
        private val SPO2_AVERAGE_VALUE = Regex("""\bavgSpo2=(\d+)""")
        private val SPO2_LATEST_TIME = Regex("""latestSpoRecord=.*?\btime=(\d+)""")
        private val SPO2_LATEST_VALUE = Regex("""latestSpoRecord=.*?\bvalue=(\d+)""")
        private val SPO2_REPORT_TIME = Regex("""DailySpo2Report\(time=(\d+)""")
    }
}
