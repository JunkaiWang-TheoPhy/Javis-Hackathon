package com.javis.wearable.gateway.bluetooth

import org.junit.Assert.assertEquals
import org.junit.Test

class BandConnectionRepositoryTest {
    @Test
    fun `known band mac maps bonded but not connected state`() {
        val state = BandConnectionRepository.resolveState(
            deviceMac = "D0:AE:05:0D:A0:94",
            bonded = true,
            connected = false
        )

        assertEquals("bonded", state.status)
    }
}
