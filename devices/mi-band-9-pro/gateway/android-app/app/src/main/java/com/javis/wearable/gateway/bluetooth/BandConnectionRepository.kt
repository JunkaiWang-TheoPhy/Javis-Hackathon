package com.javis.wearable.gateway.bluetooth

import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.content.Context
import com.javis.wearable.gateway.BandConfig
import java.time.Clock
import java.time.Instant

data class BandConnectionState(
    val status: String,
    val deviceName: String? = BandConfig.bandName,
    val mac: String = BandConfig.bandMac,
    val bonded: Boolean = false,
    val connected: Boolean = false,
    val bluetoothEnabled: Boolean = false,
    val observedAt: Instant? = null
)

class BandConnectionRepository(
    private val context: Context,
    private val clock: Clock = Clock.systemDefaultZone()
) {
    fun currentState(): BandConnectionState {
        val observedAt = Instant.now(clock)
        val manager = context.getSystemService(BluetoothManager::class.java)
            ?: return resolveState(
                deviceMac = BandConfig.bandMac,
                bonded = false,
                connected = false,
                bluetoothEnabled = false,
                observedAt = observedAt
            )

        return try {
            val adapter = manager.adapter
                ?: return resolveState(
                    deviceMac = BandConfig.bandMac,
                    bonded = false,
                    connected = false,
                    bluetoothEnabled = false,
                    observedAt = observedAt
                )

            if (!adapter.isEnabled) {
                return resolveState(
                    deviceMac = BandConfig.bandMac,
                    bonded = false,
                    connected = false,
                    bluetoothEnabled = false,
                    observedAt = observedAt
                )
            }

            val bandDevice = adapter.bondedDevices.orEmpty().firstOrNull {
                it.address.equals(BandConfig.bandMac, ignoreCase = true)
            }
            val bonded = bandDevice != null
            val connected = bandDevice?.let { isConnected(manager, it) } ?: false

            resolveState(
                deviceMac = bandDevice?.address ?: BandConfig.bandMac,
                bonded = bonded,
                connected = connected,
                deviceName = bandDevice?.name ?: BandConfig.bandName,
                bluetoothEnabled = true,
                observedAt = observedAt
            )
        } catch (_: SecurityException) {
            resolveState(
                deviceMac = BandConfig.bandMac,
                bonded = false,
                connected = false,
                deviceName = BandConfig.bandName,
                bluetoothEnabled = false,
                observedAt = observedAt
            )
        }
    }

    private fun isConnected(manager: BluetoothManager, device: BluetoothDevice): Boolean {
        val profiles = listOf(BluetoothProfile.GATT, BluetoothProfile.A2DP, BluetoothProfile.HEADSET)
        return profiles.any { profile ->
            manager.getConnectionState(device, profile) == BluetoothProfile.STATE_CONNECTED
        }
    }

    companion object {
        fun resolveState(
            deviceMac: String,
            bonded: Boolean,
            connected: Boolean,
            deviceName: String? = BandConfig.bandName,
            bluetoothEnabled: Boolean = true,
            observedAt: Instant? = null
        ): BandConnectionState {
            val status = when {
                !bluetoothEnabled -> "bluetooth_off"
                connected -> "connected"
                bonded -> "bonded"
                else -> "disconnected"
            }

            return BandConnectionState(
                status = status,
                deviceName = deviceName,
                mac = deviceMac,
                bonded = bonded,
                connected = connected,
                bluetoothEnabled = bluetoothEnabled,
                observedAt = observedAt
            )
        }
    }
}
