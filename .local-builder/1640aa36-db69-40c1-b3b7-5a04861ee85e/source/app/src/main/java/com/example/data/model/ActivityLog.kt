package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class LogType {
    COMMAND,
    FILE_READ,
    FILE_EDIT,
    TEST_RESULT,
    BUILD_OUTPUT,
    VERIFY_APK,
    SYSTEM_INFO
}

enum class LogStatus {
    SUCCESS,
    RUNNING,
    WARNING,
    ERROR
}

@Entity(tableName = "activity_logs")
data class ActivityLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val type: LogType,
    val title: String,
    val details: String = "",
    val status: LogStatus = LogStatus.SUCCESS,
    val exitCode: Int? = null,
    val durationMs: Long = 0,
    val timestamp: Long = System.currentTimeMillis()
)
