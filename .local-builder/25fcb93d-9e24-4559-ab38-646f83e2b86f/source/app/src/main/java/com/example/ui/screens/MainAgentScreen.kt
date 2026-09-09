package com.example.ui.screens

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
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
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
import androidx.compose.ui.text.style.TextAlign
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
import com.example.ui.theme.StatusWarning
import com.example.ui.theme.TextPrimary
import com.example.ui.theme.TextSecondary

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
    developerMode: Boolean = false,
    modifier: Modifier = Modifier
) {
    var inputText by remember { mutableStateOf("") }
    var selectedViewTab by remember { mutableIntStateOf(0) }
    val listState = rememberLazyListState()

    LaunchedEffect(chatMessages.size) {
        if (chatMessages.isNotEmpty()) {
            listState.animateScrollToItem(chatMessages.lastIndex)
        }
    }

    LaunchedEffect(developerMode) {
        if (!developerMode) selectedViewTab = 0
    }

    val quickCommands = listOf(
        "Inspect project",
        "Check current status",
        "Run complete project test",
        "Build APK",
        "Fix build error"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBackground)
    ) {
        TopStatusBar(
            projectName = projectMemory.projectName,
            termuxConnected = termuxHealth.isHealthy,
            termuxLatencyMs = termuxHealth.latencyMs,
            geminiConnected = geminiHealth.first,
            onRefresh = onRefreshHealth
        )

        AutonomousProgressCard(state = loopState)

        if (developerMode) {
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
                            Icon(Icons.Default.Psychology, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Chat (${chatMessages.size})", fontSize = 12.sp)
                        }
                    }
                )
                Tab(
                    selected = selectedViewTab == 1,
                    onClick = { selectedViewTab = 1 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Terminal, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Logs (${activityLogs.size})", fontSize = 12.sp)
                        }
                    }
                )
            }
        }

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            if (developerMode && selectedViewTab == 1) {
                ActivityLogsView(
                    logs = activityLogs,
                    modifier = Modifier.fillMaxSize()
                )
            } else if (chatMessages.isEmpty()) {
                AgentEmptyState(onSelectCommand = onSendMessage)
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(vertical = 8.dp)
                        .testTag("chat_messages_list"),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    items(chatMessages, key = { it.id }) { message ->
                        ChatBubble(
                            message = message,
                            developerMode = developerMode,
                            onApprove = { approved -> onApproveAction(message.id, approved) }
                        )
                    }
                }
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(DarkSurfaceVariant)
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 12.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            quickCommands.forEach { command ->
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = DarkSurface,
                    border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .clickable { onSendMessage(command) }
                        .testTag("quick_chip_${command.replace(" ", "_").lowercase()}")
                ) {
                    Text(
                        text = command,
                        color = SkyBlueAccent,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }
        }

        Surface(
            modifier = Modifier.fillMaxWidth().testTag("bottom_task_input_bar"),
            color = DarkSurface,
            tonalElevation = 6.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.Bottom
            ) {
                IconButton(
                    onClick = { },
                    modifier = Modifier
                        .size(42.dp)
                        .testTag("attach_task_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.AttachFile,
                        contentDescription = "Attach file",
                        tint = TextSecondary
                    )
                }

                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = {
                        Text(
                            text = "Describe a task...",
                            color = TextSecondary,
                            fontSize = 13.sp
                        )
                    },
                    modifier = Modifier
                        .weight(1f)
                        .testTag("task_input_field"),
                    shape = RoundedCornerShape(22.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = DarkBackground,
                        unfocusedContainerColor = DarkBackground,
                        focusedBorderColor = SkyBlueAccent,
                        unfocusedBorderColor = DarkBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        cursorColor = SkyBlueAccent
                    ),
                    maxLines = 3
                )

                Spacer(modifier = Modifier.width(6.dp))
                IconButton(
                    onClick = {
                        if (inputText.isNotBlank()) {
                            val task = inputText.trim()
                            inputText = ""
                            onSendMessage(task)
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
                        contentDescription = "Send task",
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
                        contentDescription = "Clear chat",
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
    val starters = listOf(
        "Inspect project",
        "Check current status",
        "Build APK"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(76.dp)
                .clip(CircleShape)
                .background(SkyBlueAccent.copy(alpha = 0.13f))
                .border(1.5.dp, SkyBlueAccent.copy(alpha = 0.45f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Psychology,
                contentDescription = "AI agent",
                tint = SkyBlueAccent,
                modifier = Modifier.size(42.dp)
            )
        }
        Spacer(modifier = Modifier.height(18.dp))
        Text(
            text = "Ready when you are",
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Upload ZIP → Analyze → Build → Install APK",
            style = MaterialTheme.typography.bodyMedium,
            color = SkyBlueAccent,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Give the agent a task and it will inspect the project, run the necessary checks, and report each step.",
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 18.sp
        )
        Spacer(modifier = Modifier.height(20.dp))
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            starters.forEach { command ->
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = DarkSurface,
                    border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelectCommand(command) }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.PlayArrow,
                            contentDescription = null,
                            tint = SkyBlueAccent,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = command,
                            color = TextPrimary,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp
                        )
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
        Box(modifier = modifier, contentAlignment = Alignment.Center) {
            Text(
                text = "No developer logs yet.\nRun a task to inspect execution telemetry.",
                color = TextSecondary,
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center
            )
        }
        return
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(12.dp)
            .testTag("activity_logs_list"),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(logs, key = { it.id }) { log ->
            val color = when (log.status) {
                LogStatus.SUCCESS -> StatusSuccess
                LogStatus.RUNNING -> SkyBlueAccent
                LogStatus.WARNING -> StatusWarning
                LogStatus.ERROR -> StatusError
            }
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = DarkSurface,
                border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.35f)),
                modifier = Modifier.fillMaxWidth().testTag("activity_log_item_${log.id}")
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(9.dp)
                                .clip(CircleShape)
                                .background(color)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = log.title,
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f)
                        )
                        Text(
                            text = log.status.name,
                            color = color,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    if (log.details.isNotBlank()) {
                        Spacer(modifier = Modifier.height(7.dp))
                        Text(
                            text = log.details,
                            color = TextSecondary,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFF070A10), RoundedCornerShape(8.dp))
                                .padding(9.dp)
                        )
                    }
                }
            }
        }
    }
}