package com.javis.wearable.gateway.model

import org.junit.Assert.assertTrue
import org.junit.Test

class GatewaySnapshotTest {
    @Test
    fun `snapshot json includes configured band identity`() {
        val json = GatewaySnapshot.sample().toJson()
        assertTrue(json.contains("D0:AE:05:0D:A0:94"))
        assertTrue(json.contains("940134049"))
        assertTrue(json.contains("\"heart_rate_bpm\":null"))
    }
}
