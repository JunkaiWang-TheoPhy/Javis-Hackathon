package com.javis.wearable.gateway.health

import androidx.health.connect.client.HealthConnectClient

data class HealthConnectSettingsDestination(
    val action: String? = null,
    val packageName: String? = null,
    val className: String? = null
) {
    init {
        require(
            action != null || (packageName != null && className != null)
        ) { "A destination must provide either an action or an explicit component." }
    }
}

data class HealthConnectProviderSelection(
    val packageName: String,
    val sdkStatus: Int
)

object HealthConnectCompat {
    const val healthClientName = "HealthData"
    const val healthConnectSettingsAction = "androidx.health.ACTION_HEALTH_CONNECT_SETTINGS"
    const val healthConnectBindAction = "androidx.health.ACTION_BIND_HEALTH_DATA_SERVICE"
    const val xiaomiPlatformBindAction = "androidx.health.platform.client.ACTION_BIND_SDK_SERVICE"
    const val googleProviderPackage = "com.google.android.apps.healthdata"
    const val xiaomiProviderPackage = "com.mi.health"

    val providerPackages: List<String> = listOf(
        googleProviderPackage,
        xiaomiProviderPackage
    )

    fun selectProviderPackage(sdkStatusesByPackage: Map<String, Int>): String {
        return selectProvider(sdkStatusesByPackage).packageName
    }

    fun selectProvider(sdkStatusesByPackage: Map<String, Int>): HealthConnectProviderSelection {
        val providerStatuses = providerPackages.map { packageName ->
            HealthConnectProviderSelection(
                packageName = packageName,
                sdkStatus = sdkStatusesByPackage[packageName] ?: HealthConnectClient.SDK_UNAVAILABLE
            )
        }

        return providerStatuses.firstOrNull { it.sdkStatus == HealthConnectClient.SDK_AVAILABLE }
            ?: providerStatuses.firstOrNull {
                it.sdkStatus == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
            }
            ?: providerStatuses.first()
    }

    fun getSettingsDestinations(
        settingsAction: String = healthConnectSettingsAction
    ): List<HealthConnectSettingsDestination> {
        return listOf(
            HealthConnectSettingsDestination(action = settingsAction),
            HealthConnectSettingsDestination(
                packageName = xiaomiProviderPackage,
                className = "com.xiaomi.fitness.access.health_connect.HealthConnectPrivacyActivity"
            ),
            HealthConnectSettingsDestination(
                packageName = xiaomiProviderPackage,
                className = "com.xiaomi.fitness.access.HealthConnectPrivacyActivity"
            )
        )
    }

    fun getPermissionDestinations(): List<HealthConnectSettingsDestination> {
        return listOf(
            HealthConnectSettingsDestination(
                packageName = xiaomiProviderPackage,
                className = "com.xiaomi.fitness.access.health_connect.HealthConnectPrivacyActivity"
            ),
            HealthConnectSettingsDestination(
                packageName = xiaomiProviderPackage,
                className = "com.xiaomi.fitness.access.HealthConnectPrivacyActivity"
            )
        )
    }
}
