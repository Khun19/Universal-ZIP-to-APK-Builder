package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "agent_settings")
data class AgentSettings(
    @PrimaryKey val id: Int = 1,
    val termuxUrl: String = "http://127.0.0.1:8787",
    val termuxToken: String = "",
    val geminiApiKey: String = "",
    val geminiModel: String = "gemini-3.5-flash",
    val projectDir: String = "Universal-ZIP-to-APK-Builder-main",
    val autoApproveSafeCommands: Boolean = true,
    val requireApprovalForDangerous: Boolean = true,
    val maxRepairAttempts: Int = 5,
    val developerMode: Boolean = false
)
