package com.javis.wearable.gateway.health

import java.nio.file.Files
import java.nio.file.Path
import org.junit.Assert.assertTrue
import org.junit.Test

class AndroidManifestPermissionsTest {
    @Test
    fun `required Health Connect permissions are declared in manifest`() {
        val manifestContents = String(Files.readAllBytes(locateManifest()))
        val missingPermissions = HealthPermissions.requiredPermissions.filterNot { permission ->
            manifestContents.contains("""android:name="$permission"""")
        }

        assertTrue(
            "Manifest is missing Health Connect permissions: ${missingPermissions.joinToString()}",
            missingPermissions.isEmpty()
        )
    }

    @Test
    fun `health connect rationale activity is declared in manifest`() {
        val manifestContents = String(Files.readAllBytes(locateManifest()))

        assertTrue(
            "Manifest is missing PermissionsRationaleActivity registration.",
            manifestContents.contains("""android:name=".PermissionsRationaleActivity"""")
        )
        assertTrue(
            "Manifest is missing androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE handler.",
            manifestContents.contains(
                """<action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />"""
            )
        )
        assertTrue(
            "Manifest is missing Android 14+ VIEW_PERMISSION_USAGE alias.",
            manifestContents.contains("""android:name="ViewPermissionUsageActivity"""")
        )
        assertTrue(
            "Manifest is missing android.intent.action.VIEW_PERMISSION_USAGE handler.",
            manifestContents.contains(
                """<action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />"""
            )
        )
        assertTrue(
            "Manifest is missing android.intent.category.DEFAULT for Health Connect intent handlers.",
            manifestContents.contains("""<category android:name="android.intent.category.DEFAULT" />""")
        )
    }

    private fun locateManifest(): Path {
        val candidates = sequence {
            var current = Path.of("").toAbsolutePath()
            while (true) {
                yield(current.resolve("src/main/AndroidManifest.xml"))
                yield(
                    current.resolve(
                        "devices/mi-band-9-pro/gateway/android-app/app/src/main/AndroidManifest.xml"
                    )
                )
                current = current.parent ?: break
            }
        }

        return candidates.firstOrNull { Files.exists(it) }
            ?: error("Could not locate AndroidManifest.xml from ${Path.of("").toAbsolutePath()}")
    }
}
