package com.example.ui.model

import com.example.data.model.ChatMessage
import com.example.data.model.MessageRole

enum class MessageStatus {
    RUNNING,
    SUCCESS,
    WARNING,
    ERROR
}

fun ChatMessage.uiStatus(): MessageStatus {
    if (isApprovalGranted == false) return MessageStatus.ERROR
    if (requiresApproval && isApprovalGranted == null) return MessageStatus.WARNING

    val normalizedContent = content.lowercase()
    return when {
        listOf("error", "failed", "failure", "exception", "rejected").any { normalizedContent.contains(it) } ->
            MessageStatus.ERROR
        listOf("running", "processing", "analyzing", "building", "checking", "working").any { normalizedContent.contains(it) } ->
            MessageStatus.RUNNING
        role == MessageRole.TOOL_STEP && isSuccess ->
            MessageStatus.SUCCESS
        !isSuccess ->
            MessageStatus.ERROR
        else ->
            MessageStatus.SUCCESS
    }
}

fun MessageStatus.label(): String = when (this) {
    MessageStatus.RUNNING -> "Running"
    MessageStatus.SUCCESS -> "Success"
    MessageStatus.WARNING -> "Warning"
    MessageStatus.ERROR -> "Error"
}