package com.callrecorder.ry.domain.model

enum class RecordingMode(val displayName: String) {
    FULL("Full 2-Way (InCall/Dialer)"),
    LEGACY("Legacy (Voice Call)"),
    MIC_ONLY_FALLBACK("Mic Fallback (Microphone)")
}

data class Recording(
    val id: Long = 0,
    val phoneNumber: String,
    val contactName: String?,
    val callType: Int,
    val callStartTime: Long,
    val callDuration: Long,
    val recordingFilePath: String,
    val recordingFileSize: Long,
    val recordingDuration: Long,
    val recordingMode: RecordingMode,
    val isBackedUp: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

data class ExcludedNumber(
    val phoneNumber: String,
    val contactName: String?,
    val addedAt: Long = System.currentTimeMillis()
)
