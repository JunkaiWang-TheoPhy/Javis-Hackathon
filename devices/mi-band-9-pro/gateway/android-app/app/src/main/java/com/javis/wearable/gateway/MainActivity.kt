package com.javis.wearable.gateway

import android.Manifest
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.javis.wearable.gateway.health.HealthConnectCompat
import com.javis.wearable.gateway.health.HealthConnectSettingsDestination
import com.javis.wearable.gateway.health.HealthConnectRepository
import com.javis.wearable.gateway.health.HealthPermissions
import com.javis.wearable.gateway.service.GatewayForegroundService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    private lateinit var healthRepository: HealthConnectRepository
    private lateinit var statusView: TextView

    private val googleHealthPermissionLauncher = registerForActivityResult(
        HealthPermissions.requestPermissionContract(HealthConnectCompat.googleProviderPackage)
    ) { grantedPermissions ->
        handleHealthPermissionResult(grantedPermissions)
    }

    private val runtimePermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { result ->
        val missing = result.filterValues { granted -> !granted }.keys
        val status = if (missing.isEmpty()) {
            "Bluetooth and notification permissions granted."
        } else {
            "Missing Android permissions: ${missing.joinToString(", ")}"
        }
        refreshStatus(status)
    }

    private fun handleHealthPermissionResult(grantedPermissions: Set<String>) {
        val status = if (HealthPermissions.hasAll(grantedPermissions)) {
            "Health Connect permissions granted."
        } else {
            "Health Connect permissions are still missing."
        }
        refreshStatus(status)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        healthRepository = HealthConnectRepository(applicationContext)
        setContentView(buildContent())
        refreshStatus()
    }

    override fun onResume() {
        super.onResume()
        refreshStatus()
    }

    private fun buildContent() = ScrollView(this).apply {
        addView(
            LinearLayout(this@MainActivity).apply {
                orientation = LinearLayout.VERTICAL
                val padding = (24 * resources.displayMetrics.density).toInt()
                setPadding(padding, padding, padding, padding)

                addView(TextView(context).apply {
                    text = getString(R.string.app_name)
                    textSize = 22f
                })

                statusView = TextView(context).apply {
                    textSize = 15f
                }
                addView(statusView)

                addView(Button(context).apply {
                    text = getString(R.string.grant_android_permissions_button)
                    setOnClickListener { requestRuntimePermissions() }
                })

                addView(Button(context).apply {
                    text = getString(R.string.open_health_connect_button)
                    setOnClickListener { openHealthConnectSettings() }
                })

                addView(Button(context).apply {
                    text = getString(R.string.grant_permissions_button)
                    setOnClickListener {
                        requestHealthPermissions()
                    }
                })

                addView(Button(context).apply {
                    text = getString(R.string.start_gateway_button)
                    setOnClickListener {
                        ContextCompat.startForegroundService(
                            this@MainActivity,
                            GatewayForegroundService.startIntent(this@MainActivity)
                        )
                        refreshStatus("Gateway service start requested.")
                    }
                })

                addView(Button(context).apply {
                    text = getString(R.string.stop_gateway_button)
                    setOnClickListener {
                        stopService(GatewayForegroundService.stopIntent(this@MainActivity))
                        refreshStatus("Gateway service stop requested.")
                    }
                })
            }
        )
    }

    private fun requestRuntimePermissions() {
        val permissions = requiredRuntimePermissions()
        if (permissions.isEmpty()) {
            refreshStatus("No runtime Android permissions required on this SDK level.")
            return
        }

        if (hasRuntimePermissions()) {
            refreshStatus("Android runtime permissions are already granted.")
            return
        }

        runtimePermissionLauncher.launch(permissions)
    }

    private fun requiredRuntimePermissions(): Array<String> {
        val permissions = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions += Manifest.permission.BLUETOOTH_CONNECT
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions += Manifest.permission.POST_NOTIFICATIONS
        }
        return permissions.toTypedArray()
    }

    private fun hasRuntimePermissions(): Boolean {
        return requiredRuntimePermissions().all { permission ->
            ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun openHealthConnectSettings() {
        openCompatibleActivity(
            destinations = HealthConnectCompat.getSettingsDestinations(),
            missingActivityStatus =
                "No compatible Health Connect settings activity was found on this phone."
        )
    }

    private fun requestHealthPermissions() {
        when (healthRepository.availability().providerPackage) {
            HealthConnectCompat.xiaomiProviderPackage -> {
                openCompatibleActivity(
                    destinations = HealthConnectCompat.getPermissionDestinations(),
                    missingActivityStatus =
                        "No compatible Xiaomi Fitness health permission page was found on this phone.",
                    openedStatus =
                        "Opened Xiaomi Fitness health permission page. Complete the flow there and return."
                )
            }

            else -> {
                googleHealthPermissionLauncher.launch(HealthPermissions.requiredPermissions)
            }
        }
    }

    private fun openCompatibleActivity(
        destinations: List<HealthConnectSettingsDestination>,
        missingActivityStatus: String,
        openedStatus: String? = null
    ) {
        val destination = destinations.firstOrNull { candidate ->
            buildIntent(candidate).resolveActivity(packageManager) != null
        }

        if (destination == null) {
            refreshStatus(missingActivityStatus)
            return
        }

        try {
            startActivity(buildIntent(destination))
            if (openedStatus != null) {
                refreshStatus(openedStatus)
            }
        } catch (_: ActivityNotFoundException) {
            refreshStatus(missingActivityStatus)
        }
    }

    private fun buildIntent(destination: HealthConnectSettingsDestination): Intent {
        return when {
            destination.action != null -> Intent(destination.action)
            else -> Intent().setClassName(destination.packageName!!, destination.className!!)
        }
    }

    private fun refreshStatus(extraLine: String? = null) {
        lifecycleScope.launch {
            val availability = healthRepository.availability()
            val grantedPermissions = withContext(Dispatchers.IO) {
                healthRepository.grantedPermissions()
            }
            statusView.text = buildString {
                appendLine("Band: ${BandConfig.bandName}")
                appendLine("MAC: ${BandConfig.bandMac}")
                appendLine("DID: ${BandConfig.bandDid}")
                appendLine("Gateway: http://127.0.0.1:${BandConfig.gatewayPort}")
                appendLine("Android runtime permissions ready: ${hasRuntimePermissions()}")
                appendLine("Provider: ${availability.providerPackage}")
                appendLine("Health Connect: ${availability.message}")
                appendLine(
                    "Permissions: ${grantedPermissions.intersect(HealthPermissions.requiredPermissions).size}/${HealthPermissions.requiredPermissions.size}"
                )
                extraLine?.let { appendLine(it) }
            }
        }
    }
}
