package com.javis.wearable.gateway.local

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class XiaomiFitnessLogParserTest {
    @Test
    fun `parses latest daily step report from Xiaomi log lines`() {
        val parser = XiaomiFitnessLogParser()

        val metrics = parser.parse(
            listOf(
                "2026-03-15 00:29:11.306|3.53.1|I|fitness_16964_17499|[HomeDataRepository] STEP - (DailyStepReport(time=1773504000, time = 2026-03-15 00:00:00, tag='home', steps=172, distance=99, calories=7, minStartTime=1773504840, maxEndTime=1773505500, avgStep=172, avgDis=99, active=null, stepRecords=[StepRecord{time = 2026-03-15 00:00:00, steps = 172, distance = 99, calories = 7}]))"
            )
        )

        assertEquals(172, metrics.steps)
        assertEquals("xiaomi_fitness_log", metrics.stepsSource)
        assertEquals("2026-03-14T16:25:00Z", metrics.sourceTimestamp.toString())
    }

    @Test
    fun `parses latest spo2 report when Xiaomi log contains non zero value`() {
        val parser = XiaomiFitnessLogParser()

        val metrics = parser.parse(
            listOf(
                "2026-03-15 01:12:11.841|3.53.1|I|fitness_16964_17499|[HomeDataRepository] SPO2 - (DailySpo2Report(time=1773507600, time=2026-03-15 01:00:00, tag='home', avgSpo2=97, maxSpo2=99, minSpo2=95, lackTimes=0, spo2Records=[], abnormalRecords=null, latestSpoRecord=Spo2Record(time=1773508320, value=98)))"
            )
        )

        assertEquals(98, metrics.spo2Percent)
        assertEquals("xiaomi_fitness_log", metrics.spo2Source)
        assertEquals("2026-03-14T17:12:00Z", metrics.sourceTimestamp.toString())
    }

    @Test
    fun `ignores empty spo2 report`() {
        val parser = XiaomiFitnessLogParser()

        val metrics = parser.parse(
            listOf(
                "2026-03-15 00:29:11.841|3.53.1|I|fitness_16964_17499|[HomeDataRepository] SPO2 - (DailySpo2Report(time=1773504000, time=2026-03-15 00:00:00, tag='home', avgSpo2=0, maxSpo2=0, minSpo2=0, lackTimes=0, spo2Records=[], abnormalRecords=null, latestSpoRecord=null))"
            )
        )

        assertNull(metrics.spo2Percent)
    }
}
