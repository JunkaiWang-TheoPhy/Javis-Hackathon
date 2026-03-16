package com.javis.rokidcompanion

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class RokidSdkSetupTest {

    @Test
    fun placeholderValuesAreReportedAsNotReady() {
        val status = RokidSdkSetup.evaluate(
            clientSecret = "CHANGE_ME_CLIENT_SECRET",
            snResourceName = "sn_placeholder"
        )

        assertFalse(status.isReady)
        assertEquals(listOf("clientSecret", "snResource"), status.missingRequirements)
    }

    @Test
    fun realValuesAreNormalizedAndReportedAsReady() {
        val status = RokidSdkSetup.evaluate(
            clientSecret = "abcd-1234-efgh",
            snResourceName = "sn_0a981387ebb845bc82db11f4ac9bffa3"
        )

        assertTrue(status.isReady)
        assertEquals("abcd1234efgh", status.normalizedClientSecret)
        assertEquals(emptyList<String>(), status.missingRequirements)
    }
}
