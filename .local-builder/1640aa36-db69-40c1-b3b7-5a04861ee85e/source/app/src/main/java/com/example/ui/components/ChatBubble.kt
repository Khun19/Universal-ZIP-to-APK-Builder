package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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
import com.example.data.model.ChatMessage
import com.example.data.model.MessageRole
import com.example.ui.theme.DarkBorder
import com.example.ui.theme.DarkSurface
import com.example.ui.theme.DarkSurfaceVariant
import com.example.ui.theme.DeepBlueAccent
import com.example.ui.theme.SkyBlueAccent
import com.example.ui.theme.SoftBlueContainer
import com.example.ui.theme.StatusError
import com.example.ui.theme.StatusSuccess
import com.example.ui.theme.StatusWarning
import com.example.ui.theme.TextCode
import com.example.ui.theme.TextPrimary
import com.example.ui.theme.TextSecondary

@Composable
fun ChatBubble(
    message: ChatMessage,
    onApprove: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    when (message.role) {
        MessageRole.USER -> {
            Row(
                modifier = modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.End
            ) {
                Surface(
                    shape = RoundedCornerShape(16.dp, 16.dp, 2.dp, 16.dp),
                    color = DeepBlueAccent,
                    border = androidx.compose.foundation.BorderStroke(1.dp, SkyBlueAccent.copy(alpha = 0.5f)),
                    modifier = Modifier.fillMaxWidth(0.85f).testTag("user_chat_bubble")
                ) {
                    Text(
                        text = message.content,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextPrimary,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }
        }

        MessageRole.AGENT -> {
            Row(
                modifier = modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.Start
            ) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(SkyBlueAccent.copy(alpha = 0.2f))
                        .border(1.dp, SkyBlueAccent.copy(alpha = 0.5f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Psychology,
                        contentDescription = "AI Agent",
                        tint = SkyBlueAccent,
                        modifier = Modifier.size(16.dp)
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                Column(modifier = Modifier.fillMaxWidth(0.9f)) {
                    Surface(
                        shape = RoundedCornerShape(2.dp, 16.dp, 16.dp, 16.dp),
                        color = DarkSurface,
                        border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
                        modifier = Modifier.testTag("agent_chat_bubble")
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = message.content,
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextPrimary
                            )

                            // If requires approval
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
        }

        MessageRole.TOOL_STEP -> {
            ToolStepCard(
                message = message,
                modifier = modifier.padding(horizontal = 16.dp, vertical = 2.dp)
            )
        }

        MessageRole.SYSTEM -> {
            Row(
                modifier = modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 4.dp),
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
fun ToolStepCard(
    message: ChatMessage,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .clickable { expanded = !expanded }
            .testTag("tool_step_card"),
        shape = RoundedCornerShape(8.dp),
        color = DarkSurfaceVariant,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (message.isSuccess) StatusSuccess.copy(alpha = 0.25f) else StatusError.copy(alpha = 0.35f)
        )
    ) {
        Column(modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(16.dp)
                            .clip(CircleShape)
                            .background(
                                if (message.isSuccess) StatusSuccess.copy(alpha = 0.2f)
                                else StatusError.copy(alpha = 0.2f)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (message.isSuccess) Icons.Default.Check else Icons.Default.Close,
                            contentDescription = null,
                            tint = if (message.isSuccess) StatusSuccess else StatusError,
                            modifier = Modifier.size(11.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Text(
                        text = message.content,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (message.isSuccess) StatusSuccess else StatusError,
                        fontWeight = FontWeight.Medium,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp
                    )
                }

                if (message.toolDetails != null) {
                    Icon(
                        imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = "Expand",
                        tint = TextSecondary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            AnimatedVisibility(visible = expanded && message.toolDetails != null) {
                Column(modifier = Modifier.padding(top = 8.dp)) {
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = Color(0xFF090D16),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = message.toolDetails ?: "",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextCode,
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
                text = "The agent requested to run an potentially risky operation:\nAction: $action\nCommand / Target: $target",
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
