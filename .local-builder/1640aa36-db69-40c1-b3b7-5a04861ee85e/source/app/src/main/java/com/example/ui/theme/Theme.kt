package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val SophisticatedDarkColorScheme = darkColorScheme(
    primary = SkyBlueAccent,
    onPrimary = DarkBackground,
    primaryContainer = DeepBlueAccent,
    onPrimaryContainer = SoftBlueContainer,
    secondary = SkyBlueAccent,
    onSecondary = DarkBackground,
    secondaryContainer = ActiveChip,
    onSecondaryContainer = TextHighContrast,
    tertiary = StatusSuccess,
    onTertiary = DarkBackground,
    background = DarkBackground,
    onBackground = TextHighContrast,
    surface = DarkSurface,
    onSurface = TextHighContrast,
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = TextSecondary,
    outline = DarkBorder,
    outlineVariant = DarkBorderSubtle,
    error = StatusError,
    onError = DarkBackground,
    errorContainer = StatusErrorDark,
    onErrorContainer = StatusError
)

@Composable
fun MyApplicationTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = SophisticatedDarkColorScheme,
        typography = Typography,
        content = content
    )
}
