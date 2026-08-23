package com.callrecorder.ry.data.db.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "recordings")
data class RecordingEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val phoneNumber: String,
    val contactName: String?,
    val callType: Int,           // android.provider.CallLog.Calls.INCOMING_TYPE, OUTGOING_TYPE, MISSED_TYPE
    val callStartTime: Long,     // epoch millis
    val callDuration: Long,      // seconds
    val recordingFilePath: String,
    val recordingFileSize: Long, // bytes
    val recordingDuration: Long, // millis
    val recordingMode: String,   // "FULL" | "LEGACY" | "MIC_ONLY_FALLBACK"
    val isBackedUp: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "excluded_numbers")
data class ExcludedNumberEntity(
    @PrimaryKey
    val phoneNumber: String,
    val contactName: String?,
    val addedAt: Long = System.currentTimeMillis()
)
