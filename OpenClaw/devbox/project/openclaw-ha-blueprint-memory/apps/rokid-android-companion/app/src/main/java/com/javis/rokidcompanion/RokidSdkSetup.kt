package com.javis.rokidcompanion

data class RokidSdkStatus(
    val isReady: Boolean,
    val normalizedClientSecret: String,
    val missingRequirements: List<String>
)

object RokidSdkSetup {
    fun evaluate(clientSecret: String, snResourceName: String): RokidSdkStatus {
        val normalizedClientSecret = clientSecret.replace("-", "").trim()
        val missingRequirements = buildList {
            if (normalizedClientSecret.isBlank() || normalizedClientSecret == "CHANGE_ME_CLIENT_SECRET") {
                add("clientSecret")
            }
            if (snResourceName.isBlank() || snResourceName == "sn_placeholder") {
                add("snResource")
            }
        }

        return RokidSdkStatus(
            isReady = missingRequirements.isEmpty(),
            normalizedClientSecret = normalizedClientSecret,
            missingRequirements = missingRequirements
        )
    }
}
