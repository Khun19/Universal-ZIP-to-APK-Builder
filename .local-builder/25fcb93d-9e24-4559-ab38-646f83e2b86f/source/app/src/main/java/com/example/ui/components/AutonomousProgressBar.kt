package com.example.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AutonomousLoopState
import com.example.ui.theme.DarkBorder
import com.example.ui.theme.DarkSurface
import com.example.ui.theme.SkyBlueAccent
import com.example.ui.theme.StatusError
import com.example.ui.theme.StatusSuccess
import com.example.ui.theme.StatusWarning
import com.example.ui.theme.TextPrimary
import com.example.ui.theme.TextSecondary

private data class TimelineStep(
    val title: String,
    val icon: ImageVector,
    val phase: String?
)

private enum class StepState {
    PENDING,
    RUNNING,
    SUCCESS,
    ERROR
}

private val timelineSteps = listOf(
    TimelineStep("Analyze project", Icons.Default.Search, "INSPECT"),
    TimelineStep("Security check", Icons.Default.Security, "PLAN"),
    TimelineStep("Detect framework", Icons.Default.Code, "EDIT"),
    TimelineStep("Install dependencies", Icons.Default.PlayArrow, "TEST"),
    TimelineStep("Build APK", Icons.Default.Build, "BUILD"),
    TimelineStep("Validate APK", Icons.Default.CheckCircle, "VERIFY"),
    TimelineStep("Completed", Icons.Default.Check, null)
)

@Composable
fun AutonomousProgressCard(
    state: AutonomousLoopState,
    modifier: Modifier = Modifier
) {
    if (!state.isActive && state.currentTask.isBlank() && state.errorMessage == null) return

    val phaseIndex = timelineSteps.indexOfFirst { it.phase == state.phase }
    val completed = !state.isActive && state.errorMessage == null && state.phase == "VERIFY"
    val transition = rememberInfiniteTransition(label = "timeline_running")
    val runningAlpha by transition.animateFloat(
        initialValue = 0.55f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "timeline_running_alpha"
    )
    val progressValue = when {
        completed -> 1f
        phaseIndex < 0 -> 0f
        else -> ((phaseIndex + 0.5f) / timelineSteps.size).coerceIn(0f, 1f)
    }

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .testTag("autonomous_progress_card"),
        shape = RoundedCornerShape(16.dp),
        color = DarkSurface,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (state.errorMessage == null) SkyBlueAccent.copy(alpha = 0.35f)
            else StatusError.copy(alpha = 0.45f)
        )
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "BUILD PIPELINE",
                        style = MaterialTheme.typography.labelSmall,
                        color = SkyBlueAccent,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = if (completed) "Completed" else state.currentTask.ifBlank { state.phase },
                        style = MaterialTheme.typography.bodySmall,
                        color = TextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                if (state.currentAttempt > 1) {
                    TimelineBadge(
                        text = "Attempt ${state.currentAttempt}/${state.maxAttempts}",
                        color = StatusWarning
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            LinearProgressIndicator(
                progress = progressValue,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(5.dp)
                    .clip(RoundedCornerShape(5.dp)),
                color = if (state.errorMessage == null) SkyBlueAccent else StatusError,
                trackColor = DarkBorder
            )

            Spacer(modifier = Modifier.height(12.dp))
            timelineSteps.forEachIndexed { index, step ->
                val stepState = stepState(
                    index = index,
                    phaseIndex = phaseIndex,
                    isActive = state.isActive,
                    completed = completed,
                    hasError = state.errorMessage != null
                )
                TimelineRow(
                    step = step,
                    state = stepState,
                    isLast = index == timelineSteps.lastIndex,
                    runningAlpha = runningAlpha,
                    detail = if (stepState == StepState.RUNNING) state.currentLog else null
                )
            }

            state.errorMessage?.let { error ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = error,
                    color = StatusError,
                    style = MaterialTheme.typography.bodySmall,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp
                )
            }
        }
    }
}

private fun stepState(
    index: Int,
    phaseIndex: Int,
    isActive: Boolean,
    completed: Boolean,
    hasError: Boolean
): StepState = when {
    completed -> StepState.SUCCESS
    hasError && index == phaseIndex -> StepState.ERROR
    index < phaseIndex -> StepState.SUCCESS
    isActive && index == phaseIndex -> StepState.RUNNING
    else -> StepState.PENDING
}

@Composable
private fun TimelineRow(
    step: TimelineStep,
    state: StepState,
    isLast: Boolean,
    runningAlpha: Float,
    detail: String?
) {
    val color = when (state) {
        StepState.PENDING -> TextSecondary.copy(alpha = 0.5f)
        StepState.RUNNING -> SkyBlueAccent
        StepState.SUCCESS -> StatusSuccess
        StepState.ERROR -> StatusError
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .alpha(if (state == StepState.RUNNING) runningAlpha else 1f)
            .padding(vertical = 3.dp),
        verticalAlignment = Alignment.Top
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(26.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.14f))
                    .border(1.dp, color.copy(alpha = 0.55f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = step.icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(14.dp)
                )
            }
            if (!isLast) {
                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .height(18.dp)
                        .background(DarkBorder)
                )
            }
        }

        Spacer(modifier = Modifier.width(10.dp))
        Column(modifier = Modifier.padding(top = 2.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = step.title,
                    style = MaterialTheme.typography.bodySmall,
                    color = if (state == StepState.PENDING) TextSecondary else TextPrimary,
                    fontWeight = if (state == StepState.RUNNING) FontWeight.Bold else FontWeight.Medium
                )
                Spacer(modifier = Modifier.width(8.dp))
                TimelineBadge(text = state.label(), color = color)
            }
            if (!detail.isNullOrBlank()) {
                Text(
                    text = detail,
                    color = TextSecondary,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 10.sp,
                    maxLines = 1
                )
            }
        }
    }
}

@Composable
private fun TimelineBadge(text: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(color.copy(alpha = 0.12f))
            .border(1.dp, color.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
            .padding(horizontal = 5.dp, vertical = 2.dp)
    ) {
        Text(
            text = text,
            color = color,
            fontSize = 8.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

private fun StepState.label(): String = when (this) {
    StepState.PENDING -> "Pending"
    StepState.RUNNING -> "Running"
    StepState.SUCCESS -> "Done"
    StepState.ERROR -> "Error"
}