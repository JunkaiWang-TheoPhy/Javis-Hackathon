package com.javis.wearable.gateway.local

import android.content.Context
import android.net.Uri
import com.javis.wearable.gateway.BandConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class XiaomiFitnessProviderProbe(
    private val context: Context
) {
    suspend fun probe(): XiaomiProviderProbeResult = withContext(Dispatchers.IO) {
        val rootStatus = queryStatus(Uri.parse("content://${BandConfig.xiaomiProviderMainAuthority}"))
        val candidateStatuses = candidatePaths.associateWith { path ->
            queryStatus(Uri.parse("content://${BandConfig.xiaomiProviderMainAuthority}/$path"))
        }

        val readablePath = candidateStatuses.entries.firstOrNull { it.value == "rows_available" }?.key
        when {
            readablePath != null -> XiaomiProviderProbeResult(
                status = "rows_available",
                detail = "content://${BandConfig.xiaomiProviderMainAuthority}/$readablePath"
            )

            candidateStatuses.values.any { it == "permission_denied" } -> XiaomiProviderProbeResult(
                status = "permission_denied",
                detail = summarize(rootStatus, candidateStatuses)
            )

            candidateStatuses.values.any { it == "no_provider_deploy" } -> XiaomiProviderProbeResult(
                status = "no_provider_deploy",
                detail = summarize(rootStatus, candidateStatuses)
            )

            else -> XiaomiProviderProbeResult(
                status = rootStatus,
                detail = summarize(rootStatus, candidateStatuses)
            )
        }
    }

    private fun queryStatus(uri: Uri): String {
        return try {
            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                if (cursor.count > 0) "rows_available" else "root_query_empty"
            } ?: "null_cursor"
        } catch (error: SecurityException) {
            classifySecurityException(error)
        } catch (error: IllegalArgumentException) {
            "invalid_uri"
        } catch (error: Throwable) {
            "error:${error.javaClass.simpleName}"
        }
    }

    private fun classifySecurityException(error: SecurityException): String {
        val message = error.message.orEmpty()
        return when {
            "no provider deploy" in message -> "no_provider_deploy"
            "Permission Denial" in message -> "permission_denied"
            else -> "security_exception"
        }
    }

    private fun summarize(
        rootStatus: String,
        candidateStatuses: Map<String, String>
    ): String {
        val sample = candidateStatuses.entries
            .take(4)
            .joinToString(",") { "${it.key}=${it.value}" }
        return "root=$rootStatus;$sample"
    }

    companion object {
        private val candidatePaths = listOf(
            "steps",
            "step_record",
            "heart_rate",
            "heart_rate_record",
            "resting_heart_rate",
            "spo2",
            "spo2_record",
            "summary",
            "daily_record"
        )
    }
}
