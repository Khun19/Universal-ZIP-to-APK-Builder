package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.ActivityLog
import com.example.data.model.AutonomousLoopState
import com.example.data.model.ChatMessage
import com.example.data.model.LogStatus
import com.example.data.model.ProjectMemory
import com.example.data.remote.TermuxHealthResult
import com.example.ui.components.AutonomousProgressCard
import com.example.ui.components.ChatBubble
import com.example.ui.components.TopStatusBar
import com.example.ui.theme.DarkBackground
import com.example.ui.theme.DarkBorder
import com.example.ui.theme.DarkSurface
import com.example.ui.theme.DarkSurfaceVariant
import com.example.ui.theme.SkyBlueAccent
import com.example.ui.theme.StatusError
import com.example.ui.theme.StatusSuccess
import com.example.ui.theme.TextPrimary
import com.example.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAgentScreen(
    projectMemory: ProjectMemory,
    termuxHealth: TermuxHealthResult,
    geminiHealth: Pair<Boolean, String>,
    loopState: AutonomousLoopState,
    chatMessages: List<ChatMessage>,
    activityLogs: List<ActivityLog>,
    onSendMessage: (String) -> Unit,
    onApproveAction: (Long, Boolean) -> Unit,
    onRefreshHealth: () -> Unit,
    onClearChat: () -> Unit,
    modifier: Modifier = Modifier
) {
    var inputText by remember { mutableStateOf("") }
    var selectedViewTab by remember { mutableIntStateOf(0) } // 0: Chat, 1: Activity Log
    val listState = rememberLazyListState()

    // Scroll to bottom when new messages arrive
    LaunchedEffect(chatMessages.size) {
        if (chatMessages.isNotEmpty()) {
            listState.animateScrollToItem(chatMessages.size - 1)
        }
    }

    val quickCommands = listOf(
        "Inspect project",
        "Check current status",
        "Run complete project test",
        "Build APK",
        "Fix build error",
        "Implement Capacitor support",
        "Continue project roadmap"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBackground)
    ) {
        // Top status bar
        TopStatusBar(
            projectName = projectMemory.projectName,
            termuxConnected = termuxHealth.isHealthy,
            termuxLatencyMs = termuxHealth.latencyMs,
            geminiConnected = geminiHealth.first,
            onRefresh = onRefreshHealth
        )

        // Autonomous Loop Active Card
        AutonomousProgressCard(state = loopState)

        // View Tabs: Chat vs Activity Log
        TabRow(
            selectedTabIndex = selectedViewTab,
            containerColor = DarkSurface,
            contentColor = SkyBlueAccent,
            modifier = Modifier.fillMaxWidth().testTag("main_view_tab_row")
        ) {
            Tab(
                selected = selectedViewTab == 0,
                onClick = { selectedViewTab = 0 },
                text = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Psychology, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("AI Chat & Tools (${chatMessages.size})", fontSize = 12.sp)
                    }
                }
            )
            Tab(
                selected = selectedViewTab == 1,
                onClick = { selectedViewTab = 1 },
                text = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Terminal, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Activity Logs (${activityLogs.size})", fontSize = 12.sp)
                    }
                }
            )
        }

        // Main Content Area
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            if (selectedViewTab == 0) {
                // Chat View
                if (chatMessages.isEmpty()) {
                    AgentEmptyState(
                        onSelectCommand = { cmd ->
                            onSendMessage(cmd)
                        }
                    )
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(vertical = 8.dp)
                            .testTag("chat_messages_list")
                    ) {
                        items(chatMessages, key = { it.id }) { msg ->
                            ChatBubble(
                                message = msg,
                                onApprove = { approved ->
                                    onApproveAction(msg.id, approved)
                                }
                            )
                        }
                    }
                }
            } else {
                // Activity Log View
                ActivityLogsView(
                    logs = activityLogs,
                    modifier = Modifier.fillMaxSize()
                )
            }
        }

        // Quick developer action chips row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(DarkSurfaceVariant)
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 12.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            quickCommands.forEach { cmd ->
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = DarkSurface,
                    border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .clickable {
                            onSendMessage(cmd)
                        }
                        .testTag("quick_chip_${cmd.replace(" ", "_").lowercase()}")
                ) {
                    Text(
                        text = cmd,
                        style = MaterialTheme.typography.labelSmall,
                        color = SkyBlueAccent,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp
                    )
                }
            }
        }

        // Bottom input bar
        Surface(
            modifier = Modifier.fillMaxWidth().testTag("bottom_task_input_bar"),
            color = DarkSurface,
            tonalElevation = 6.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = {
                        Text(
                            text = "Give task (e.g. 'Fix build error', 'Build APK')...",
                            fontSize = 13.sp,
                            color = TextSecondary
                        )
                    },
                    modifier = Modifier
                        .weight(1f)
                        .testTag("task_input_field"),
                    shape = RoundedCornerShape(24.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = DarkBackground,
                        unfocusedContainerColor = DarkBackground,
                        focusedBorderColor = SkyBlueAccent,
                        unfocusedBorderColor = DarkBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    maxLines = 3
                )

                Spacer(modifier = Modifier.width(8.dp))

                IconButton(
                    onClick = {
                        if (inputText.isNotBlank()) {
                            val txt = inputText
                            inputText = ""
                            onSendMessage(txt)
                        }
                    },
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(SkyBlueAccent)
                        .testTag("send_task_button")
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = "Send Task",
                        tint = Color.Black,
                        modifier = Modifier.size(20.dp)
                    )
                }

                IconButton(
                    onClick = onClearChat,
                    modifier = Modifier.size(36.dp).testTag("clear_chat_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.DeleteSweep,
                        contentDescription = "Clear Chat",
                        tint = TextSecondary,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun AgentEmptyState(
    onSelectCommand: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(CircleShape)
                .background(SkyBlueAccent.copy(alpha = 0.15f))
                .border(1.5.dp, SkyBlueAccent.copy(alpha = 0.4f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Psychology,
                contentDescription = null,
                tint = SkyBlueAccent,
                modifier = Modifier.size(36.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "AI Engineer Standby",
            style = MaterialTheme.typography.titleMedium,
            color = TextPrimary,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = "Assigned 100% to Universal-ZIP-to-APK-Builder-main.\nReady to inspect code, run vitest suites, resolve build issues, and generate real APKs via Termux.",
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            lineHeight = 18.sp
        )

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "RECOMMENDED ACTIONS",
            style = MaterialTheme.typography.labelSmall,
            color = SkyBlueAccent,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp
        )

        Spacer(modifier = Modifier.height(10.dp))

        val starters = listOf(
            "Inspect project" to "Audits directory structure and git status",
            "Check current status" to "Evaluates build pipeline and framework detectors",
            "Run complete project test" to "Executes vitest suite on Termux",
            "Build APK" to "Runs full Universal ZIP-to-APK pipeline",
            "Fix build error" to "Analyzes build logs and patches src/builder/engine.ts"
        )

        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            starters.forEach { (cmd, desc) ->
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = DarkSurface,
                    border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .clickable { onSelectCommand(cmd) }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.PlayArrow,
                            contentDescription = null,
                            tint = SkyBlueAccent,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = cmd,
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextPrimary,
                                fontWeight = FontWeight.SemiBold,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp
                            )
                            Text(
                                text = desc,
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary,
                                fontSize = 10.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ActivityLogsView(
    logs: List<ActivityLog>,
    modifier: Modifier = Modifier
) {
    if (logs.isEmpty()) {
        Box(
            modifier = modifier,
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "No activity logs recorded yet.\nRun a test or task to view execution telemetry.",
                color = TextSecondary,
                style = MaterialTheme.typography.bodySmall,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }
    } else {
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(12.dp)
                .testTag("activity_logs_list"),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(logs, key = { it.id }) { log ->
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = DarkSurface,
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (log.status == LogStatus.SUCCESS) DarkBorder
                        else StatusError.copy(alpha = 0.4f)
                    ),
                    modifier = Modifier.fillMaxWidth().testTag("activity_log_item_${log.id}")
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(
                                            if (log.status == LogStatus.SUCCESS) StatusSuccess else StatusError
                                        )
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = log.title,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextPrimary,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 12.sp
                                )
                            }

                            Text(
                                text = "${log.durationMs}ms",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextSecondary,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp
                            )
                        }

                        if (log.details.isNotBlank()) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = Color(0xFF070A10),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = log.details,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFFB0B8C4),
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.sp,
                                    modifier = Modifier.padding(8.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
