package com.javis.rokidcompanion

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val activityContext = this
        val config = RokidSdkConfig.fromBuildConfig()

        setContent {
            var snByteLength by mutableIntStateOf(0)
            var lastProbeMessage by mutableStateOf("未探测")

            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.background
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Rokid Android Companion",
                        style = MaterialTheme.typography.headlineSmall
                    )
                    Text("SDK 坐标: com.rokid.cxr:client-m:1.0.9")
                    Text("Client Secret: ${config.setupStatus.normalizedClientSecret.ifBlank { "(未配置)" }}")
                    Text("SN 资源名: ${config.snResourceName}")
                    Text("配置就绪: ${if (config.setupStatus.isReady) "是" else "否"}")
                    if (config.setupStatus.missingRequirements.isNotEmpty()) {
                        Text("缺失项: ${config.setupStatus.missingRequirements.joinToString()}")
                    }
                    Text("当前蓝牙连接: ${if (RokidBluetoothFacade.isBluetoothConnected()) "已连接" else "未连接"}")
                    Text("SN 文件字节数: $snByteLength")
                    Text("最近探测: $lastProbeMessage")

                    Spacer(modifier = Modifier.height(8.dp))

                    Button(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = {
                            lastProbeMessage = try {
                                snByteLength = config.readSnBytes(activityContext).size
                                "已读取 SN 授权文件"
                            } catch (error: Exception) {
                                "读取失败: ${error.message}"
                            }
                        }
                    ) {
                        Text("验证 SN 文件接入")
                    }

                    Button(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = {
                            lastProbeMessage = if (RokidBluetoothFacade.isBluetoothConnected()) {
                                "SDK 报告蓝牙已连接"
                            } else {
                                "SDK 报告蓝牙未连接"
                            }
                        }
                    ) {
                        Text("刷新 SDK 连接状态")
                    }
                }
            }
        }
    }
}
