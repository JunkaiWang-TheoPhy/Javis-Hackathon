package com.javis.wearable.gateway

object BandConfig {
    const val gatewayPort = 8765
    const val healthConnectLookbackDays = 7

    const val bandName = "Xiaomi Smart Band 9 Pro A094"
    const val bandMac = "D0:AE:05:0D:A0:94"
    const val bandDid = "940134049"
    const val bandModel = "miwear.watch.n67cn"
    const val bandFirmware = "3.1.171"

    const val phoneAdbSerial = "4722a997"
    const val phoneModel = "Xiaomi 12X"

    const val miFitnessPackage = "com.mi.health"
    const val wearableManagerPackage = "com.huami.watch.hmwatchmanager"
    const val xiaomiProviderMainAuthority = "com.mi.health.provider.main"
    const val xiaomiProviderDeviceAuthority = "com.mi.health.provider.device"
    const val xiaomiFitnessMainLogPath = "/sdcard/Android/data/com.mi.health/files/log/XiaomiFit.main.log"
    const val xiaomiFitnessDeviceLogPath = "/sdcard/Android/data/com.mi.health/files/log/XiaomiFit.device.log"
}
