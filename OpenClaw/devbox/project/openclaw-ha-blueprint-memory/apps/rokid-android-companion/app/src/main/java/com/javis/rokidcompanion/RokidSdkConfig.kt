package com.javis.rokidcompanion

import android.content.Context

data class RokidSdkConfig(
    val clientSecret: String,
    val snResourceName: String,
    val setupStatus: RokidSdkStatus
) {
    fun resolveSnResourceId(context: Context): Int {
        return context.resources.getIdentifier(snResourceName, "raw", context.packageName)
    }

    fun readSnBytes(context: Context): ByteArray {
        val resourceId = resolveSnResourceId(context)
        require(resourceId != 0) {
            "SN authorization resource '$snResourceName' was not found in res/raw."
        }
        return context.resources.openRawResource(resourceId).use { it.readBytes() }
    }

    companion object {
        fun fromBuildConfig(): RokidSdkConfig {
            val status = RokidSdkSetup.evaluate(
                clientSecret = BuildConfig.ROKID_CLIENT_SECRET,
                snResourceName = BuildConfig.ROKID_SN_RESOURCE
            )
            return RokidSdkConfig(
                clientSecret = BuildConfig.ROKID_CLIENT_SECRET,
                snResourceName = BuildConfig.ROKID_SN_RESOURCE,
                setupStatus = status
            )
        }
    }
}
