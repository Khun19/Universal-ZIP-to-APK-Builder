package com.example.ui.components

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.ChatMessage
import com.example.data.model.MessageRole
import com.example.ui.model.MessageStatus
import com.example.ui.model.label
import com.example.ui.model.uiStatus
import com.example.ui.theme.DarkBorder
import com.example.ui.theme.DarkSurface
import com.example.ui.theme.DarkSurfaceVariant
import com.example.ui.theme.DeepBlueAccent
import com.example.ui.theme.SkyBlueAccent
import com.example.ui.theme.StatusError
import com.example.ui.theme.StatusSuccess
import com.example.ui.theme.StatusWarning
import com.example.ui.theme.TextPrimary
import com.example.ui.theme.TextSecondary

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ChatBubble(
    message: ChatMessage,
    onApprove: (Boolean) -> Unit,
    developerMode: Boolean = false,
    modifier: Modifier = Modifier
) {
    when (message.role) {
        MessageRole.USER -> UserMessageBubble(message = message, modifier = modifier)
        MessageRole.AGENT -> AgentMessageBubble(
            message = message,
            onApprove = onApprove,
            modifier = modifier
        )
        MessageRole.TOOL_STEP -> ToolStepCard(
            message = message,
            developerMode = developerMode,
            modifier = modifier.padding(horizontal = 16.dp, vertical = 3.dp)
        )
        MessageRole.SYSTEM -> {
            Row(
                modifier = modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 5.dp),
                horizontalArrangement = Arrangement.Center
            ) {
                Text(
                    text = message.content,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp
                )
            }
        }
    }
}

@Composable
private fun UserMessageBubble(
    message: ChatMessage,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 5.dp),
        horizontalArrangement = Arrangement.End
    ) {
        Surface(
            shape = RoundedCornerShape(18.dp, 18.dp, 4.dp, 18.dp),
            color = DeepBlueAccent,
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                SkyBlueAccent.copy(alpha = 0.45f)
            ),
            modifier = Modifier
                .fillMaxWidth(0.84f)
                .testTag("user_chat_bubble")
        ) {
            Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp)) {
                Text(
                    text = "YOU",
                    style = MaterialTheme.typography.labelSmall,
                    color = SkyBlueAccent,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    fontSize = 9.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextPrimary
                )
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun AgentMessageBubble(
    message: ChatMessage,
    onApprove: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val clipboardManager = LocalClipboardManager.current
    var copied by remember(message.id) { mutableStateOf(false) }
    val status = message.uiStatus()

    LaunchedEffect(copied) {
        if (copied) {
            kotlinx.coroutines.delay(2000)
            copied = false
        }
    }

    val copyResponse = {
        clipboardManager.setText(AnnotatedString(message.content))
        copied = true
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.Start,
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(CircleShape)
                .background(SkyBlueAccent.copy(alpha = 0.14f))
                .border(1.dp, SkyBlueAccent.copy(alpha = 0.45f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Psychology,
                contentDescription = "AI Agent",
                tint = SkyBlueAccent,
                modifier = Modifier.size(18.dp)
            )
        }

        Spacer(modifier = Modifier.width(9.dp))

        Surface(
            shape = RoundedCornerShape(4.dp, 18.dp, 18.dp, 18.dp),
            color = DarkSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
            modifier = Modifier
                .fillMaxWidth(0.91f)
                .testTag("agent_chat_bubble")
                .combinedClickable(
                    onClick = { },
                    onLongClick = copyResponse
                )
        ) {
            Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "AGENT",
                        style = MaterialTheme.typography.labelSmall,
                        color = SkyBlueAccent,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        modifier = Modifier.weight(1f)
                    )
                    StatusBadge(status = status)
                    IconButton(
                        onClick = copyResponse,
                        modifier = Modifier
                            .size(32.dp)
                            .testTag("copy_agent_response_button")
                    ) {
                        Icon(
                            imageVector = if (copied) Icons.Default.Check else Icons.Default.ContentCopy,
                            contentDescription = if (copied) "Response copied" else "Copy response",
                            tint = if (copied) StatusSuccess else TextSecondary,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                MessageContent(content = message.content)

                if (copied) {
                    Text(
                        text = "Copied ✓",
                        style = MaterialTheme.typography.labelSmall,
                        color = StatusSuccess,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }

                if (message.requiresApproval && message.isApprovalGranted == null) {
                    Spacer(modifier = Modifier.height(10.dp))
                    DangerousActionApprovalBox(
                        action = message.approvalAction ?: "Action",
                        target = message.approvalTarget ?: "",
                        onDecision = onApprove
                    )
                } else if (message.isApprovalGranted != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = if (message.isApprovalGranted == true) "✓ Action Approved" else "✗ Action Rejected",
                        color = if (message.isApprovalGranted == true) StatusSuccess else StatusError,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun StatusBadge(status: MessageStatus) {
    val color = when (status) {
        MessageStatus.RUNNING -> SkyBlueAccent
        MessageStatus.SUCCESS -> StatusSuccess
        MessageStatus.WARNING -> StatusWarning
        MessageStatus.ERROR -> StatusError
    }
    val icon = when (status) {
        MessageStatus.RUNNING -> Icons.Default.PlayArrow
        MessageStatus.SUCCESS -> Icons.Default.Check
        MessageStatus.WARNING -> Icons.Default.Warning
        MessageStatus.ERROR -> Icons.Default.Close
    }

    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.12f))
            .border(1.dp, color.copy(alpha = 0.35f), RoundedCornerShape(8.dp))
            .padding(horizontal = 6.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = color,
            modifier = Modifier.size(12.dp)
        )
        Spacer(modifier = Modifier.width(3.dp))
        Text(
            text = status.label(),
            color = color,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun ToolStepCard(
    message: ChatMessage,
    developerMode: Boolean = false,
    modifier: Modifier = Modifier
) {
    var expanded by remember(message.id, developerMode) { mutableStateOf(false) }
    val status = message.uiStatus()

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(enabled = developerMode) { expanded = !expanded }
            .testTag("tool_step_card"),
        shape = RoundedCornerShape(12.dp),
        color = DarkSurfaceVariant,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            statusBorderColor(status).copy(alpha = 0.35f)
        )
    ) {
        Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Code,
                    contentDescription = "Tool step",
                    tint = SkyBlueAccent,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f)
                )
                StatusBadge(status = status)
                if (developerMode && message.toolDetails != null) {
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = if (expanded) "Hide details" else "View details",
                        tint = TextSecondary,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            if (developerMode && expanded && !message.toolDetails.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFF090D16),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = message.toolDetails.orEmpty(),
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(10.dp)
                    )
                }
            }
        }
    }
}

private fun statusBorderColor(status: MessageStatus): Color = when (status) {
    MessageStatus.RUNNING -> SkyBlueAccent
    MessageStatus.SUCCESS -> StatusSuccess
    MessageStatus.WARNING -> StatusWarning
    MessageStatus.ERROR -> StatusError
}

@Composable
fun DangerousActionApprovalBox(
    action: String,
    target: String,
    onDecision: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .testTag("dangerous_approval_box"),
        shape = RoundedCornerShape(10.dp),
        color = StatusWarning.copy(alpha = 0.1f),
        border = androidx.compose.foundation.BorderStroke(1.dp, StatusWarning.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = "Warning",
                    tint = StatusWarning,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "SAFETY VERIFICATION REQUIRED",
                    style = MaterialTheme.typography.labelMedium,
                    color = StatusWarning,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }

            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "The agent requested a potentially risky operation:\nAction: $action\nCommand / Target: $target",
                style = MaterialTheme.typography.bodySmall,
                color = TextPrimary,
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp
            )

            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { onDecision(false) },
                    modifier = Modifier.weight(1f).testTag("reject_action_button"),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = StatusError),
                    border = androidx.compose.foundation.BorderStroke(1.dp, StatusError.copy(alpha = 0.6f))
                ) {
                    Text("Reject", fontSize = 12.sp)
                }
                ElevatedButton(
                    onClick = { onDecision(true) },
                    modifier = Modifier.weight(1f).testTag("approve_action_button"),
                    colors = ButtonDefaults.elevatedButtonColors(
                        containerColor = StatusSuccess,
                        contentColor = Color.Black
                    )
                ) {
                    Text("Approve", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }
    }
}