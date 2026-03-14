package com.javis.wearable.gateway.model

import com.javis.wearable.gateway.BandConfig
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

internal val gatewayJson = Json {
    encodeDefaults = true
    explicitNulls = true
}

@Serializable
data class GatewaySnapshot(
    val device: DeviceInfo,
    val phone: PhoneInfo,
    val connection: ConnectionStatus,
    val metrics: MetricSnapshot = MetricSnapshot(),
    val timestamps: TimestampSnapshot = TimestampSnapshot(),
    val source: SourceSnapshot = SourceSnapshot()
) {
    fun toJson(): String = gatewayJson.encodeToString(this)

    companion object {
        fun sample(): GatewaySnapshot {
            return GatewaySnapshot(
                device = DeviceInfo(
                    name = BandConfig.bandName,
                    mac = BandConfig.bandMac,
                    did = BandConfig.bandDid,
                    model = BandConfig.bandModel,
                    firmware = BandConfig.bandFirmware
                ),
                phone = PhoneInfo(
                    adbSerial = BandConfig.phoneAdbSerial,
                    model = BandConfig.phoneModel
                ),
                connection = ConnectionStatus(status = "unknown")
            )
        }
    }
}

@Serializable
data class DeviceInfo(
    val name: String,
    val mac: String,
    val did: String,
    val model: String,
    val firmware: String
)

@Serializable
data class PhoneInfo(
    @SerialName("adb_serial")
    val adbSerial: String,
    val model: String
)

@Serializable
data class ConnectionStatus(
    val status: String,
    @SerialName("last_seen_at")
    val lastSeenAt: String? = null
)

@Serializable
data class MetricSnapshot(
    @SerialName("heart_rate_bpm")
    val heartRateBpm: Int? = null,
    @SerialName("spo2_percent")
    val spo2Percent: Int? = null,
    val steps: Int? = null
)

@Serializable
data class TimestampSnapshot(
    @SerialName("source_timestamp")
    val sourceTimestamp: String? = null,
    @SerialName("gateway_timestamp")
    val gatewayTimestamp: String? = null
)

@Serializable
data class SourceSnapshot(
    @SerialName("heart_rate")
    val heartRate: String? = null,
    val spo2: String? = null,
    val steps: String? = null,
    val connection: String? = null
)
