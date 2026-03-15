package com.javis.wearable.gateway.http

import com.javis.wearable.gateway.model.GatewayStatus
import java.io.InputStream
import java.io.OutputStream
import java.io.PipedInputStream
import java.io.PipedOutputStream
import java.util.concurrent.CopyOnWriteArrayList

class SseBroker {
    private val subscribers = CopyOnWriteArrayList<OutputStream>()

    fun openStream(): InputStream {
        val input = PipedInputStream()
        val output = PipedOutputStream(input)
        subscribers += output
        output.write(formatComment("connected").toByteArray(Charsets.UTF_8))
        output.flush()
        return input
    }

    fun broadcast(event: String, jsonData: String) {
        val payload = formatEvent(event, jsonData).toByteArray(Charsets.UTF_8)
        val failed = mutableListOf<OutputStream>()
        for (subscriber in subscribers) {
            try {
                subscriber.write(payload)
                subscriber.flush()
            } catch (_: Exception) {
                failed += subscriber
            }
        }
        failed.forEach { subscriber ->
            subscribers.remove(subscriber)
            runCatching { subscriber.close() }
        }
    }

    fun broadcastConnection(status: GatewayStatus) {
        broadcast("connection_update", status.toJson())
    }

    companion object {
        fun formatEvent(event: String, jsonData: String): String {
            return "event: $event\ndata: $jsonData\n\n"
        }

        fun formatComment(comment: String): String {
            return ": $comment\n\n"
        }
    }
}
