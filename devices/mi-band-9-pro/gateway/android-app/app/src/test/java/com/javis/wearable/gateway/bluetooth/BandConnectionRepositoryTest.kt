package com.javis.wearable.gateway.bluetooth

import android.bluetooth.BluetoothProfile
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
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

    @Test
    fun `unsupported bluetooth profiles are ignored while checking connection state`() {
        val method = BandConnectionRepository.Companion::class.java.getMethod(
            "hasConnectedProfile",
            Iterable::class.java,
            kotlin.jvm.functions.Function1::class.java
        )

        val connected = method.invoke(
            BandConnectionRepository.Companion,
            listOf(BluetoothProfile.A2DP, BluetoothProfile.GATT),
            { profile: Int ->
                if (profile == BluetoothProfile.A2DP) {
                    throw IllegalArgumentException("Profile not supported: $profile")
                }
                BluetoothProfile.STATE_CONNECTED
            }
        ) as Boolean

        assertTrue(connected)
    }
}
