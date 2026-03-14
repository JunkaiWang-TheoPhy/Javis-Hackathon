package com.javis.wearable.gateway.http

import com.javis.wearable.gateway.BandConfig
import com.javis.wearable.gateway.model.GatewayStatus
import com.javis.wearable.gateway.store.GatewaySnapshotStore
import fi.iki.elonen.NanoHTTPD

class GatewayHttpServer(
    private val snapshotStore: GatewaySnapshotStore,
    private val sseBroker: SseBroker,
    private val statusProvider: () -> GatewayStatus = { GatewayStatus() },
    private val debugSourceProvider: () -> String = {
        """{"health_connect":"unconfigured","bluetooth":"unconfigured"}"""
    },
    port: Int = BandConfig.gatewayPort
) : NanoHTTPD("127.0.0.1", port) {

    fun renderLatest(): String = snapshotStore.latestJson()

    fun renderStatus(): String = statusProvider().toJson()

    fun renderDebugSource(): String = debugSourceProvider()

    override fun serve(session: IHTTPSession): Response {
        return when (session.uri) {
            "/health/latest" -> jsonResponse(renderLatest())
            "/status" -> jsonResponse(renderStatus())
            "/debug/source" -> jsonResponse(renderDebugSource())
            "/events" -> eventStreamResponse()
            else -> newFixedLengthResponse(Response.Status.NOT_FOUND, MIME_PLAINTEXT, "Not found")
        }
    }

    private fun jsonResponse(body: String): Response {
        return newFixedLengthResponse(Response.Status.OK, "application/json", body).apply {
            addHeader("Cache-Control", "no-store")
        }
    }

    private fun eventStreamResponse(): Response {
        return newChunkedResponse(
            Response.Status.OK,
            "text/event-stream",
            sseBroker.openStream()
        ).apply {
            addHeader("Cache-Control", "no-cache")
            addHeader("Connection", "keep-alive")
        }
    }
}
