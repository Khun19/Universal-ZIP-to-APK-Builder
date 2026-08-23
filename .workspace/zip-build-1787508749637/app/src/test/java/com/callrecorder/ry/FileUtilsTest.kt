package com.callrecorder.ry

import com.callrecorder.ry.domain.model.RecordingMode
import com.callrecorder.ry.util.FileUtils
import org.junit.Assert.assertEquals
import org.junit.Test

class FileUtilsTest {

    @Test
    fun testFormatDuration() {
        assertEquals("01:05", FileUtils.formatDuration(65000L))
        assertEquals("00:00", FileUtils.formatDuration(0L))
        assertEquals("10:00", FileUtils.formatDuration(600000L))
    }

    @Test
    fun testFormatFileSize() {
        assertEquals("1.0 KB", FileUtils.formatFileSize(1024L))
        assertEquals("0 B", FileUtils.formatFileSize(0L))
    }

    @Test
    fun testRecordingModeDisplay() {
        assertEquals("Full 2-Way (InCall/Dialer)", RecordingMode.FULL.displayName)
        assertEquals("Legacy (Voice Call)", RecordingMode.LEGACY.displayName)
        assertEquals("Mic Fallback (Microphone)", RecordingMode.MIC_ONLY_FALLBACK.displayName)
    }
}
