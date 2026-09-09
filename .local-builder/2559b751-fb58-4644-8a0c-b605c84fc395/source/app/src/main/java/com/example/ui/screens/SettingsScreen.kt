package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AgentSettings
import com.example.data.remote.TermuxHealthResult
import com.example.ui.theme.DarkBackground
import com.example.ui.theme.DarkBorder
import com.example.ui.theme.DarkSurface
import com.example.ui.theme.DeepBlueAccent
import com.example.ui.theme.SkyBlueAccent
import com.example.ui.theme.StatusError
import com.example.ui.theme.StatusSuccess
import com.example.ui.theme.TextCode
import com.example.ui.theme.TextPrimary
import com.example.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    currentSettings: AgentSettings,
    termuxHealth: TermuxHealthResult,
    geminiHealth: Pair<Boolean, String>,
    onSaveSettings: (AgentSettings) -> Unit,
    onTestTermux: () -> Unit,
    onTestGemini: () -> Unit,
    modifier: Modifier = Modifier
) {
    var termuxUrl by remember(currentSettings.termuxUrl) { mutableStateOf(currentSettings.termuxUrl) }
    var termuxToken by remember(currentSettings.termuxToken) { mutableStateOf(currentSettings.termuxToken) }
    var geminiApiKey by remember(currentSettings.geminiApiKey) { mutableStateOf(currentSettings.geminiApiKey) }
    var selectedModel by remember(currentSettings.geminiModel) { mutableStateOf(currentSettings.geminiModel) }
    var projectDir by remember(currentSettings.projectDir) { mutableStateOf(currentSettings.projectDir) }
    var autoApproveSafe by remember(currentSettings.autoApproveSafeCommands) { mutableStateOf(currentSettings.autoApproveSafeCommands) }
    var requireDangerousApproval by remember(currentSettings.requireApprovalForDangerous) { mutableStateOf(currentSettings.requireApprovalForDangerous) }

    var tokenVisible by remember { mutableStateOf(false) }
    var keyVisible by remember { mutableStateOf(false) }
    var modelDropdownExpanded by remember { mutableStateOf(false) }
    var savedBannerVisible by remember { mutableStateOf(false) }

    val models = listOf("gemini-3.5-flash", "gemini-3.1-pro-preview")
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBackground)
            .verticalScroll(scrollState)
            .padding(16.dp)
            .testTag("settings_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Top Card
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(SkyBlueAccent.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Settings,
                    contentDescription = null,
                    tint = SkyBlueAccent,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "AGENT CONFIGURATION",
                    style = MaterialTheme.typography.titleMedium,
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Configure Termux Agent HTTP bridge and Gemini AI engine",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    fontSize = 11.sp
                )
            }
        }

        // Save confirmation banner
        if (savedBannerVisible) {
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = StatusSuccess.copy(alpha = 0.15f),
                border = androidx.compose.foundation.BorderStroke(1.dp, StatusSuccess.copy(alpha = 0.4f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = StatusSuccess, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Configuration saved successfully!", color = StatusSuccess, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Termux Agent Section
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = DarkSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
            modifier = Modifier.fillMaxWidth().testTag("termux_settings_card")
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Terminal, contentDescription = null, tint = SkyBlueAccent, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "TERMUX AGENT CONNECTION",
                        style = MaterialTheme.typography.labelMedium,
                        color = SkyBlueAccent,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = termuxUrl,
                    onValueChange = { termuxUrl = it },
                    label = { Text("Termux Agent URL") },
                    modifier = Modifier.fillMaxWidth().testTag("termux_url_input"),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = DarkBackground,
                        unfocusedContainerColor = DarkBackground,
                        focusedBorderColor = SkyBlueAccent,
                        unfocusedBorderColor = DarkBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = termuxToken,
                    onValueChange = { termuxToken = it },
                    label = { Text("Bearer Token (Secure)") },
                    visualTransformation = if (tokenVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    trailingIcon = {
                        IconButton(onClick = { tokenVisible = !tokenVisible }) {
                            Icon(
                                imageVector = if (tokenVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = "Toggle Token Visibility",
                                tint = TextSecondary
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth().testTag("termux_token_input"),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = DarkBackground,
                        unfocusedContainerColor = DarkBackground,
                        focusedBorderColor = SkyBlueAccent,
                        unfocusedBorderColor = DarkBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = termuxHealth.message,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (termuxHealth.isHealthy) StatusSuccess else StatusError,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.weight(1f)
                    )

                    OutlinedButton(
                        onClick = onTestTermux,
                        modifier = Modifier.testTag("test_termux_button"),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Test Connection", fontSize = 12.sp)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Guide on running Termux server
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFF090D16),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(
                            text = "💡 How to start Termux Agent on phone:",
                            style = MaterialTheme.typography.labelSmall,
                            color = SkyBlueAccent,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "$ cd Universal-ZIP-to-APK-Builder-main\n$ node termux-agent.js --port=8787",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextCode,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }

        // Gemini AI Engine Section
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = DarkSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
            modifier = Modifier.fillMaxWidth().testTag("gemini_settings_card")
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Psychology, contentDescription = null, tint = SkyBlueAccent, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "GEMINI AI ENGINE",
                        style = MaterialTheme.typography.labelMedium,
                        color = SkyBlueAccent,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = geminiApiKey,
                    onValueChange = { geminiApiKey = it },
                    label = { Text("Gemini API Key") },
                    placeholder = { Text("AIzaSy...") },
                    visualTransformation = if (keyVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    trailingIcon = {
                        IconButton(onClick = { keyVisible = !keyVisible }) {
                            Icon(
                                imageVector = if (keyVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = "Toggle Key Visibility",
                                tint = TextSecondary
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth().testTag("gemini_key_input"),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = DarkBackground,
                        unfocusedContainerColor = DarkBackground,
                        focusedBorderColor = SkyBlueAccent,
                        unfocusedBorderColor = DarkBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Model Dropdown
                ExposedDropdownMenuBox(
                    expanded = modelDropdownExpanded,
                    onExpandedChange = { modelDropdownExpanded = it },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = selectedModel,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("AI Reasoning Model") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = modelDropdownExpanded) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = DarkBackground,
                            unfocusedContainerColor = DarkBackground,
                            focusedBorderColor = SkyBlueAccent,
                            unfocusedBorderColor = DarkBorder,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                            .testTag("model_selector_field"),
                        shape = RoundedCornerShape(10.dp)
                    )

                    ExposedDropdownMenu(
                        expanded = modelDropdownExpanded,
                        onDismissRequest = { modelDropdownExpanded = false }
                    ) {
                        models.forEach { modelName ->
                            DropdownMenuItem(
                                text = { Text(modelName, fontFamily = FontFamily.Monospace, fontSize = 12.sp) },
                                onClick = {
                                    selectedModel = modelName
                                    modelDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = geminiHealth.second,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (geminiHealth.first) StatusSuccess else StatusError,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.weight(1f)
                    )

                    OutlinedButton(
                        onClick = onTestGemini,
                        modifier = Modifier.testTag("test_gemini_button"),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Test Connection", fontSize = 12.sp)
                    }
                }
            }
        }

        // Safety Policy Card
        Surface(
            shape = RoundedCornerShape(14.dp),
            color = DarkSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, DarkBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Security, contentDescription = null, tint = SkyBlueAccent, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "SAFETY & EXECUTION POLICIES",
                        style = MaterialTheme.typography.labelMedium,
                        color = SkyBlueAccent,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Require Approval for Dangerous Ops", style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                        Text("Deletions, system packages, path traversal", style = MaterialTheme.typography.bodySmall, color = TextSecondary, fontSize = 11.sp)
                    }
                    Switch(
                        checked = requireDangerousApproval,
                        onCheckedChange = { requireDangerousApproval = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = SkyBlueAccent)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Auto-approve Safe Operations", style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                        Text("Reading project files, running vitest & builds", style = MaterialTheme.typography.bodySmall, color = TextSecondary, fontSize = 11.sp)
                    }
                    Switch(
                        checked = autoApproveSafe,
                        onCheckedChange = { autoApproveSafe = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = SkyBlueAccent)
                    )
                }
            }
        }

        // Save Button
        ElevatedButton(
            onClick = {
                onSaveSettings(
                    currentSettings.copy(
                        termuxUrl = termuxUrl,
                        termuxToken = termuxToken,
                        geminiApiKey = geminiApiKey,
                        geminiModel = selectedModel,
                        projectDir = projectDir,
                        autoApproveSafeCommands = autoApproveSafe,
                        requireApprovalForDangerous = requireDangerousApproval
                    )
                )
                savedBannerVisible = true
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .testTag("save_settings_button"),
            colors = ButtonDefaults.elevatedButtonColors(
                containerColor = SkyBlueAccent,
                contentColor = Color.Black
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(imageVector = Icons.Default.Save, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("Save Configuration", fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}
