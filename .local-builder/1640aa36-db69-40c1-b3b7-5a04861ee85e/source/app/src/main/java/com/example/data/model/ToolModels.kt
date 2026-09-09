package com.example.data.model

data class ToolInvocation(
    val toolName: String,
    val arguments: Map<String, String>,
    val result: String? = null,
    val isSuccess: Boolean = true,
    val durationMs: Long = 0,
    val isExpanded: Boolean = false
)

data class DangerousActionApproval(
    val id: String,
    val actionType: String,
    val commandOrPath: String,
    val reason: String,
    val isApproved: Boolean? = null
)

data class AutonomousLoopState(
    val isActive: Boolean = false,
    val currentTask: String = "",
    val phase: String = "IDLE", // INSPECT, PLAN, EDIT, TEST, BUILD, VERIFY, FIX
    val currentAttempt: Int = 1,
    val maxAttempts: Int = 5,
    val currentLog: String = "",
    val errorMessage: String? = null
)
