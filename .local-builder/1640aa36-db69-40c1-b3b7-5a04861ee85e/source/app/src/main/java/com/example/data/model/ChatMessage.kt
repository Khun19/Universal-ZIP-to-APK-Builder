package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class MessageRole {
    USER,
    AGENT,
    SYSTEM,
    TOOL_STEP
}

@Entity(tableName = "chat_messages")
data class ChatMessage(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val role: MessageRole,
    val content: String,
    val stepTitle: String? = null,
    val toolName: String? = null,
    val toolDetails: String? = null,
    val isSuccess: Boolean = true,
    val requiresApproval: Boolean = false,
    val approvalAction: String? = null,
    val approvalTarget: String? = null,
    val isApprovalGranted: Boolean? = null,
    val timestamp: Long = System.currentTimeMillis()
)
