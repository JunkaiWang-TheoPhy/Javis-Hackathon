package com.javis.wearable.gateway.health

import androidx.activity.result.contract.ActivityResultContract
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.StepsRecord

object HealthPermissions {
    const val providerPackageName = "com.google.android.apps.healthdata"

    val requiredPermissions: Set<String> = setOf(
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(OxygenSaturationRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class)
    )

    fun requestPermissionContract(): ActivityResultContract<Set<String>, Set<String>> {
        return PermissionController.createRequestPermissionResultContract()
    }

    fun hasAll(grantedPermissions: Set<String>): Boolean {
        return grantedPermissions.containsAll(requiredPermissions)
    }
}
