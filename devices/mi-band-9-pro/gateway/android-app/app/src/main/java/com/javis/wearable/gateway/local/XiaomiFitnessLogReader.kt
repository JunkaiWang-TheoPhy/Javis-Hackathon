package com.javis.wearable.gateway.local

import com.javis.wearable.gateway.BandConfig
import java.io.File
import java.io.RandomAccessFile
import java.nio.charset.StandardCharsets

class XiaomiFitnessLogReader(
    private val logFile: File = File(BandConfig.xiaomiFitnessMainLogPath),
    private val maxTailBytes: Int = 64 * 1024
) {
    fun readRecentLines(): List<String> {
        if (!logFile.exists() || !logFile.canRead()) {
            throw IllegalStateException("xiaomi_fitness_log_unreadable")
        }

        RandomAccessFile(logFile, "r").use { file ->
            val start = (file.length() - maxTailBytes).coerceAtLeast(0)
            file.seek(start)
            val bytes = ByteArray((file.length() - start).toInt())
            file.readFully(bytes)
            return bytes.toString(StandardCharsets.UTF_8)
                .lineSequence()
                .filter { it.isNotBlank() }
                .toList()
        }
    }
}
