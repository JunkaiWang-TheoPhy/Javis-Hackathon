package com.javis.wearable.gateway.health

import androidx.health.connect.client.HealthConnectClient
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class HealthConnectCompatTest {
    @Test
    fun `provider selection falls back to Xiaomi fitness when Google provider is unavailable`() {
        val providerPackage = healthConnectCompat()
            .getMethod("selectProviderPackage", Map::class.java)
            .invoke(
                healthConnectCompatInstance(),
                linkedMapOf(
                    "com.google.android.apps.healthdata" to HealthConnectClient.SDK_UNAVAILABLE,
                    "com.mi.health" to HealthConnectClient.SDK_AVAILABLE
                )
            ) as String

        assertEquals("com.mi.health", providerPackage)
    }

    @Test
    fun `settings destinations include Xiaomi fitness fallback activities`() {
        val destinations = healthConnectCompat()
            .getMethod("getSettingsDestinations", String::class.java)
            .invoke(
                healthConnectCompatInstance(),
                "androidx.health.ACTION_HEALTH_CONNECT_SETTINGS"
            ) as List<*>

        val describedDestinations = destinations.map { destination ->
            val destinationClass = destination!!::class.java
            val action = destinationClass.getMethod("getAction").invoke(destination) as String?
            val packageName =
                destinationClass.getMethod("getPackageName").invoke(destination) as String?
            val className = destinationClass.getMethod("getClassName").invoke(destination) as String?
            listOfNotNull(action, packageName, className).joinToString("|")
        }

        assertEquals(
            "androidx.health.ACTION_HEALTH_CONNECT_SETTINGS",
            describedDestinations.first()
        )
        assertTrue(
            describedDestinations.contains(
                "com.mi.health|com.xiaomi.fitness.access.health_connect.HealthConnectPrivacyActivity"
            )
        )
        assertTrue(
            describedDestinations.contains(
                "com.mi.health|com.xiaomi.fitness.access.HealthConnectPrivacyActivity"
            )
        )
    }

    private fun healthConnectCompat() =
        Class.forName("com.javis.wearable.gateway.health.HealthConnectCompat")

    private fun healthConnectCompatInstance() =
        healthConnectCompat().getField("INSTANCE").get(null)
}
