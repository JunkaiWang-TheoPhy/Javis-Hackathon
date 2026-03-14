package com.javis.wearable.gateway.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.javis.wearable.gateway.BandConfig
import com.javis.wearable.gateway.MainActivity
import com.javis.wearable.gateway.R
import com.javis.wearable.gateway.bluetooth.BandConnectionRepository
import com.javis.wearable.gateway.bluetooth.BandConnectionState
import com.javis.wearable.gateway.health.HealthConnectRepository
import com.javis.wearable.gateway.health.HealthMetrics
import com.javis.wearable.gateway.http.GatewayHttpServer
import com.javis.wearable.gateway.http.SseBroker
import com.javis.wearable.gateway.model.ConnectionStatus
import com.javis.wearable.gateway.model.GatewaySnapshot
import com.javis.wearable.gateway.model.GatewayStatus
import com.javis.wearable.gateway.model.MetricSnapshot
import com.javis.wearable.gateway.store.GatewaySnapshotStore
import java.time.Instant
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class GatewayForegroundService : Service() {
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private lateinit var snapshotStore: GatewaySnapshotStore
    private lateinit var sseBroker: SseBroker
    private lateinit var httpServer: GatewayHttpServer
    private lateinit var healthRepository: HealthConnectRepository
    private lateinit var bandConnectionRepository: BandConnectionRepository

    @Volatile
    private var lastHealthMetrics = HealthMetrics()

    @Volatile
    private var lastConnectionState = BandConnectionState(status = "unknown")

    @Volatile
    private var lastCollectedAt: String? = null

    override fun onCreate() {
        super.onCreate()
        snapshotStore = GatewaySnapshotStore()
        sseBroker = SseBroker()
        healthRepository = HealthConnectRepository(applicationContext)
        bandConnectionRepository = BandConnectionRepository(applicationContext)
        httpServer = GatewayHttpServer(
            snapshotStore = snapshotStore,
            sseBroker = sseBroker,
            statusProvider = { gatewayStatus() },
            debugSourceProvider = { debugSourceJson() }
        )

        ensureNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification("Starting gateway on port ${BandConfig.gatewayPort}"))
        httpServer.start(SOCKET_READ_TIMEOUT, false)
        startPollingLoops()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }
        return START_STICKY
    }

    override fun onDestroy() {
        serviceScope.cancel()
        runCatching { httpServer.stop() }
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startPollingLoops() {
        serviceScope.launch {
            while (isActive) {
                updateConnectionSnapshot(bandConnectionRepository.currentState())
                delay(CONNECTION_POLL_MS)
            }
        }

        serviceScope.launch {
            while (isActive) {
                updateHealthSnapshot(healthRepository.readLatestMetrics())
                delay(HEALTH_POLL_MS)
            }
        }
    }

    private fun updateConnectionSnapshot(state: BandConnectionState) {
        lastConnectionState = state
        val now = Instant.now().toString()
        val current = snapshotStore.snapshot()
        val updated = current.copy(
            device = current.device.copy(
                name = state.deviceName ?: current.device.name,
                mac = state.mac
            ),
            connection = ConnectionStatus(
                status = state.status,
                lastSeenAt = state.observedAt?.toString()
            ),
            timestamps = current.timestamps.copy(gatewayTimestamp = now),
            source = current.source.copy(connection = "bluetooth_manager")
        )

        lastCollectedAt = now
        snapshotStore.update(updated)
        sseBroker.broadcast("connection_update", updated.toJson())
        refreshNotification(updated)
    }

    private fun updateHealthSnapshot(metrics: HealthMetrics) {
        lastHealthMetrics = metrics
        val now = Instant.now().toString()
        val current = snapshotStore.snapshot()
        val updated = current.copy(
            metrics = MetricSnapshot(
                heartRateBpm = metrics.heartRateBpm,
                spo2Percent = metrics.spo2Percent,
                steps = metrics.steps
            ),
            timestamps = current.timestamps.copy(
                sourceTimestamp = metrics.sourceTimestamp?.toString(),
                gatewayTimestamp = now
            ),
            source = current.source.copy(
                heartRate = metrics.heartRateBpm?.let { "health_connect" },
                spo2 = metrics.spo2Percent?.let { "health_connect" },
                steps = metrics.steps?.let { "health_connect" },
                connection = current.source.connection ?: "bluetooth_manager"
            )
        )

        lastCollectedAt = now
        snapshotStore.update(updated)
        sseBroker.broadcast("health_update", updated.toJson())
        refreshNotification(updated)
    }

    private fun gatewayStatus(): GatewayStatus {
        return GatewayStatus(
            healthConnectReady = lastHealthMetrics.available && lastHealthMetrics.permissionGranted,
            bluetoothReady = lastConnectionState.bluetoothEnabled,
            lastCollectedAt = lastCollectedAt
        )
    }

    private fun debugSourceJson(): String {
        return buildJsonObject {
            put("health_connect_status", lastHealthMetrics.statusMessage)
            put("sdk_status", lastHealthMetrics.sdkStatus)
            put("permissions_granted", lastHealthMetrics.permissionGranted)
            put("bluetooth_enabled", lastConnectionState.bluetoothEnabled)
            put("band_status", lastConnectionState.status)
            put("band_mac", lastConnectionState.mac)
        }.toString()
    }

    private fun ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            )
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(contentText: String) = NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
        .setContentTitle(getString(R.string.notification_title))
        .setContentText(contentText)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setContentIntent(
            PendingIntent.getActivity(
                this,
                0,
                Intent(this, MainActivity::class.java),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
        )
        .build()

    private fun refreshNotification(snapshot: GatewaySnapshot) {
        val contentText = buildString {
            append("Band ")
            append(snapshot.connection.status)
            append(" | HR ")
            append(snapshot.metrics.heartRateBpm ?: "--")
            append(" | SpO2 ")
            append(snapshot.metrics.spo2Percent ?: "--")
            append(" | Steps ")
            append(snapshot.metrics.steps ?: "--")
        }

        NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, buildNotification(contentText))
    }

    companion object {
        private const val CHANNEL_ID = "mi-band-gateway"
        private const val NOTIFICATION_ID = 1901
        private const val SOCKET_READ_TIMEOUT = 5_000
        private const val CONNECTION_POLL_MS = 2_000L
        private const val HEALTH_POLL_MS = 3_000L

        const val ACTION_START = "com.javis.wearable.gateway.action.START"
        const val ACTION_STOP = "com.javis.wearable.gateway.action.STOP"

        fun startIntent(context: Context): Intent {
            return Intent(context, GatewayForegroundService::class.java).setAction(ACTION_START)
        }

        fun stopIntent(context: Context): Intent {
            return Intent(context, GatewayForegroundService::class.java).setAction(ACTION_STOP)
        }
    }
}
