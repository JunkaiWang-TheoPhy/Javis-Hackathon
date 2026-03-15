package com.javis.wearable.gateway.model

import com.javis.wearable.gateway.BandConfig
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString

@Serializable
data class GatewayStatus(
    val version: String = "0.1.0",
    @SerialName("gateway_port")
    val gatewayPort: Int = BandConfig.gatewayPort,
    @SerialName("adb_serial")
    val adbSerial: String = BandConfig.phoneAdbSerial,
    @SerialName("band_mac")
    val bandMac: String = BandConfig.bandMac,
    @SerialName("health_connect_ready")
    val healthConnectReady: Boolean = false,
    @SerialName("local_source_ready")
    val localSourceReady: Boolean = false,
    @SerialName("metrics_ready")
    val metricsReady: Boolean = false,
    @SerialName("bluetooth_ready")
    val bluetoothReady: Boolean = false,
    @SerialName("last_collected_at")
    val lastCollectedAt: String? = null
) {
    fun toJson(): String = gatewayJson.encodeToString(this)
}
