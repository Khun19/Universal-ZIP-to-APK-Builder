package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.local.AppDatabase
import com.example.data.model.ActivityLog
import com.example.data.model.AgentSettings
import com.example.data.model.AutonomousLoopState
import com.example.data.model.ChatMessage
import com.example.data.model.LogType
import com.example.data.model.MessageRole
import com.example.data.model.ProjectMemory
import com.example.data.remote.GeminiApiClient
import com.example.data.remote.TermuxApiClient
import com.example.data.remote.TermuxHealthResult
import com.example.domain.AgentExecutionEvent
import com.example.domain.AutonomousEngineer
import com.example.domain.ProjectGoalLoader
import com.example.domain.ProjectTools
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class AgentViewModel(application: Application) : AndroidViewModel(application) {
    private val db = AppDatabase.getInstance(application)
    private val settingsDao = db.settingsDao()
    private val memoryDao = db.projectMemoryDao()
    private val logDao = db.activityLogDao()
    private val chatDao = db.chatDao()

    private val termuxClient = TermuxApiClient()
    private val geminiClient = GeminiApiClient()
    private val projectTools = ProjectTools(termuxClient, logDao, memoryDao)
    val projectGoalLoader = ProjectGoalLoader(application)
    private val engineer = AutonomousEngineer(geminiClient, projectTools, chatDao, memoryDao, projectGoalLoader)

    val loopState: StateFlow<AutonomousLoopState> = engineer.loopState

    val settings: StateFlow<AgentSettings> = settingsDao.getSettings()
        .map { it ?: AgentSettings() }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = AgentSettings()
        )

    val projectMemory: StateFlow<ProjectMemory> = memoryDao.getProjectMemory()
        .map { it ?: ProjectMemory() }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = ProjectMemory()
        )

    val activityLogs: StateFlow<List<ActivityLog>> = logDao.getAllLogs()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    val chatMessages: StateFlow<List<ChatMessage>> = chatDao.getAllMessages()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    private val _termuxHealth = MutableStateFlow(
        TermuxHealthResult(isHealthy = true, latencyMs = 12, message = "Ready on 127.0.0.1:8787")
    )
    val termuxHealth: StateFlow<TermuxHealthResult> = _termuxHealth.asStateFlow()

    private val _geminiHealth = MutableStateFlow<Pair<Boolean, String>>(
        Pair(true, "Gemini Engine Ready")
    )
    val geminiHealth: StateFlow<Pair<Boolean, String>> = _geminiHealth.asStateFlow()

    private val _activeScreen = MutableStateFlow(0) // 0=Agent, 1=Dashboard, 2=Settings
    val activeScreen: StateFlow<Int> = _activeScreen.asStateFlow()

    private val _agentStatusText = MutableStateFlow("Agent Ready")
    val agentStatusText: StateFlow<String> = _agentStatusText.asStateFlow()

    init {
        // Load PROJECT_GOAL.md as the highest priority mission memory when app starts
        projectGoalLoader.loadGoal()

        // Initialize default memory and settings if empty
        viewModelScope.launch {
            if (settingsDao.getSettingsSync() == null) {
                settingsDao.saveSettings(AgentSettings())
            }
            if (memoryDao.getProjectMemorySync() == null) {
                memoryDao.saveProjectMemory(ProjectMemory())
            }
            // Check health
            checkTermux()
        }
    }

    fun setActiveScreen(index: Int) {
        _activeScreen.value = index
    }

    fun sendUserTask(taskText: String) {
        if (taskText.isBlank()) return
        viewModelScope.launch {
            val currentSettings = settingsDao.getSettingsSync() ?: AgentSettings()
            _agentStatusText.value = "Executing task..."
            engineer.executeUserTask(taskText, currentSettings) { event ->
                when (event) {
                    is AgentExecutionEvent.StatusUpdate -> {
                        _agentStatusText.value = event.step
                    }
                    is AgentExecutionEvent.Completed -> {
                        _agentStatusText.value = "Task Complete"
                    }
                    is AgentExecutionEvent.Failed -> {
                        _agentStatusText.value = "Repair Limit Exceeded (${event.attempts}/5)"
                    }
                    else -> {}
                }
            }
        }
    }

    fun approveAction(messageId: Long, isApproved: Boolean) {
        viewModelScope.launch {
            val currentSettings = settingsDao.getSettingsSync() ?: AgentSettings()
            engineer.handleApprovalResponse(messageId, isApproved, currentSettings) { event ->
                if (event is AgentExecutionEvent.StatusUpdate) {
                    _agentStatusText.value = event.step
                }
            }
        }
    }

    fun checkTermux() {
        viewModelScope.launch {
            val s = settingsDao.getSettingsSync() ?: AgentSettings()
            _termuxHealth.value = termuxClient.checkHealth(s.termuxUrl, s.termuxToken)
        }
    }

    fun testGemini() {
        viewModelScope.launch {
            val s = settingsDao.getSettingsSync() ?: AgentSettings()
            val key = s.geminiApiKey.ifBlank {
                try {
                    com.example.BuildConfig.GEMINI_API_KEY
                } catch (_: Exception) { "" }
            }
            _geminiHealth.value = geminiClient.testConnection(key, s.geminiModel)
        }
    }

    fun saveSettings(newSettings: AgentSettings) {
        viewModelScope.launch {
            settingsDao.saveSettings(newSettings)
            checkTermux()
            testGemini()
        }
    }

    fun clearChatHistory() {
        viewModelScope.launch {
            chatDao.clearChat()
        }
    }

    fun clearActivityLogs() {
        viewModelScope.launch {
            logDao.clearLogs()
        }
    }
}
