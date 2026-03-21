package com.javis.wearable.gateway

import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class PermissionsRationaleActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        title = getString(R.string.permissions_rationale_title)
        setContentView(buildContent())
    }

    private fun buildContent() = ScrollView(this).apply {
        addView(
            LinearLayout(this@PermissionsRationaleActivity).apply {
                orientation = LinearLayout.VERTICAL
                val padding = (24 * resources.displayMetrics.density).toInt()
                setPadding(padding, padding, padding, padding)

                addView(TextView(context).apply {
                    text = getString(R.string.permissions_rationale_heading)
                    textSize = 22f
                })

                addView(TextView(context).apply {
                    text = getString(R.string.permissions_rationale_body)
                    textSize = 16f
                })

                addView(Button(context).apply {
                    text = getString(R.string.permissions_rationale_close_button)
                    setOnClickListener { finish() }
                })
            }
        )
    }
}
