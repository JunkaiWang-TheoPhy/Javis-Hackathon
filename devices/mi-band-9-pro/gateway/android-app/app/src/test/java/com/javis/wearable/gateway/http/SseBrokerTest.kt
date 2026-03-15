package com.javis.wearable.gateway.http

import com.javis.wearable.gateway.model.GatewaySnapshot
import com.javis.wearable.gateway.model.MetricSnapshot
import com.javis.wearable.gateway.store.GatewaySnapshotStore
import org.junit.Assert.assertTrue
import org.junit.Test

class SseBrokerTest {
    @Test
    fun `sse event encodes event type and json data`() {
        val payload = SseBroker.formatEvent("health_update", """{"metric":"heart_rate_bpm"}""")

        assertTrue(payload.contains("event: health_update"))
        assertTrue(payload.contains("""data: {"metric":"heart_rate_bpm"}"""))
        assertTrue(payload.endsWith("\n\n"))
    }

    @Test
    fun `latest endpoint renders cached snapshot json`() {
        val store = GatewaySnapshotStore()
        store.update(GatewaySnapshot.sample().copy(metrics = MetricSnapshot(heartRateBpm = 72)))

        val server = GatewayHttpServer(snapshotStore = store, sseBroker = SseBroker())
        val body = server.renderLatest()

        assertTrue(body.contains("\"heart_rate_bpm\":72"))
        assertTrue(body.contains("D0:AE:05:0D:A0:94"))
    }
}
