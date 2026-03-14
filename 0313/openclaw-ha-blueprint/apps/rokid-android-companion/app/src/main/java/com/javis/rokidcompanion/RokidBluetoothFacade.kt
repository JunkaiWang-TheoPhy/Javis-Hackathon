package com.javis.rokidcompanion

import android.bluetooth.BluetoothDevice
import android.content.Context
import com.rokid.cxr.client.extend.CxrApi
import com.rokid.cxr.client.extend.callbacks.BluetoothStatusCallback

object RokidBluetoothFacade {
    fun isBluetoothConnected(): Boolean {
        return CxrApi.getInstance().isBluetoothConnected
    }

    fun initBluetooth(
        context: Context,
        device: BluetoothDevice,
        callback: BluetoothStatusCallback
    ) {
        CxrApi.getInstance().initBluetooth(context, device, callback)
    }

    fun connectBluetooth(
        context: Context,
        uuid: String,
        macAddress: String,
        callback: BluetoothStatusCallback,
        config: RokidSdkConfig = RokidSdkConfig.fromBuildConfig()
    ) {
        CxrApi.getInstance().connectBluetooth(
            context,
            uuid,
            macAddress,
            callback,
            config.readSnBytes(context),
            config.setupStatus.normalizedClientSecret
        )
    }

    fun disconnect() {
        CxrApi.getInstance().deinitBluetooth()
    }
}
