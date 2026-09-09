package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.screens.DashboardScreen
import com.example.ui.screens.MainAgentScreen
import com.example.ui.screens.SettingsScreen
import com.example.ui.theme.DarkBackground
import com.example.ui.theme.DarkBorder
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.SkyBlueAccent
import com.example.ui.viewmodel.AgentViewModel

enum class AgentTab(val title: String, val icon: ImageVector) {
    AGENT("Agent", Icons.Default.Terminal),
    DASHBOARD("Dashboard", Icons.Default.Dashboard),
    SETTINGS("Settings", Icons.Default.Settings)
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                val viewModel: AgentViewModel = viewModel()
                var currentTab by remember { mutableStateOf(AgentTab.AGENT) }

                val projectMemory by viewModel.projectMemory.collectAsState()
                val settings by viewModel.settings.collectAsState()
                val termuxHealth by viewModel.termuxHealth.collectAsState()
                val geminiHealth by viewModel.geminiHealth.collectAsState()
                val loopState by viewModel.loopState.collectAsState()
                val chatMessages by viewModel.chatMessages.collectAsState()
                val activityLogs by viewModel.activityLogs.collectAsState()

                Scaffold(
                    modifier = Modifier
                        .fillMaxSize()
                        .statusBarsPadding(),
                    containerColor = DarkBackground,
                    bottomBar = {
                        AgentBottomNav(
                            currentTab = currentTab,
                            onTabSelected = { currentTab = it }
                        )
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        when (currentTab) {
                            AgentTab.AGENT -> MainAgentScreen(
                                projectMemory = projectMemory,
                                termuxHealth = termuxHealth,
                                geminiHealth = geminiHealth,
                                loopState = loopState,
                                chatMessages = chatMessages,
                                activityLogs = activityLogs,
                                onSendMessage = { viewModel.sendUserTask(it) },
                                onApproveAction = { id, approved -> viewModel.approveAction(id, approved) },
                                onRefreshHealth = { viewModel.checkTermux() },
                                onClearChat = { viewModel.clearChatHistory() }
                            )
                            AgentTab.DASHBOARD -> DashboardScreen(
                                projectMemory = projectMemory,
                                onRunAction = { task ->
                                    viewModel.sendUserTask(task)
                                    currentTab = AgentTab.AGENT
                                }
                            )
                            AgentTab.SETTINGS -> SettingsScreen(
                                currentSettings = settings,
                                termuxHealth = termuxHealth,
                                geminiHealth = geminiHealth,
                                onSaveSettings = { viewModel.saveSettings(it) },
                                onTestTermux = { viewModel.checkTermux() },
                                onTestGemini = { viewModel.testGemini() }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AgentBottomNav(
    currentTab: AgentTab,
    onTabSelected: (AgentTab) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(64.dp)
            .background(DarkBackground)
            .border(1.dp, DarkBorder)
            .navigationBarsPadding(),
        horizontalArrangement = Arrangement.SpaceAround,
        verticalAlignment = Alignment.CenterVertically
    ) {
        AgentTab.entries.forEach { tab ->
            val isSelected = currentTab == tab
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier
                    .weight(1f)
                    .clickable { onTabSelected(tab) }
                    .padding(vertical = 4.dp)
                    .testTag("nav_tab_${tab.name.lowercase()}")
            ) {
                Icon(
                    imageVector = tab.icon,
                    contentDescription = tab.title,
                    tint = if (isSelected) SkyBlueAccent else Color.White.copy(alpha = 0.5f),
                    modifier = Modifier.size(24.dp)
                )
                Text(
                    text = tab.title.uppercase(),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = (-0.5).sp,
                    color = if (isSelected) SkyBlueAccent else Color.White.copy(alpha = 0.5f)
                )
            }
        }
    }
}
