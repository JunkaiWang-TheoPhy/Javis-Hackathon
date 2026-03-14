package com.javis.wearable.gateway.store

import com.javis.wearable.gateway.model.GatewaySnapshot
import java.util.concurrent.atomic.AtomicReference

class GatewaySnapshotStore(
    initialSnapshot: GatewaySnapshot = GatewaySnapshot.sample()
) {
    private val snapshotRef = AtomicReference(initialSnapshot)

    fun snapshot(): GatewaySnapshot = snapshotRef.get()

    fun latestJson(): String = snapshot().toJson()

    fun update(snapshot: GatewaySnapshot) {
        snapshotRef.set(snapshot)
    }
}
