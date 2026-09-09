package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.DarkSurfaceVariant
import com.example.ui.theme.TextCode
import com.example.ui.theme.TextPrimary

private sealed interface ContentBlock {
    data class Text(val value: String) : ContentBlock
    data class Code(val language: String, val value: String) : ContentBlock
}

private fun parseContent(content: String): List<ContentBlock> {
    val lines = content.split('\n')
    val blocks = mutableListOf<ContentBlock>()
    val textBuffer = StringBuilder()
    var codeBuffer: StringBuilder? = null
    var language = ""

    fun flushText() {
        if (textBuffer.isNotEmpty()) {
            blocks += ContentBlock.Text(textBuffer.toString())
            textBuffer.clear()
        }
    }

    fun flushCode() {
        val code = codeBuffer ?: return
        blocks += ContentBlock.Code(language, code.toString().removeSuffix("\n"))
        codeBuffer = null
        language = ""
    }

    lines.forEach { line ->
        val fence = line.trimStart()
        if (fence.startsWith("```")) {
            if (codeBuffer == null) {
                flushText()
                language = fence.removePrefix("```").trim()
                codeBuffer = StringBuilder()
            } else {
                flushCode()
            }
        } else if (codeBuffer != null) {
            codeBuffer?.append(line)?.append('\n')
        } else {
            textBuffer.append(line).append('\n')
        }
    }

    if (codeBuffer != null) flushCode()
    flushText()
    return blocks.ifEmpty { listOf(ContentBlock.Text(content)) }
}

@Composable
fun MessageContent(
    content: String,
    modifier: Modifier = Modifier
) {
    val blocks = remember(content) { parseContent(content) }

    SelectionContainer {
        Column(modifier = modifier) {
            blocks.forEachIndexed { index, block ->
                when (block) {
                    is ContentBlock.Text -> {
                        if (block.value.isNotBlank()) {
                            Text(
                                text = block.value.trimEnd(),
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextPrimary,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }

                    is ContentBlock.Code -> {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = if (index == 0) 0.dp else 8.dp),
                            color = Color(0xFF090D16),
                            shape = MaterialTheme.shapes.small
                        ) {
                            Column(
                                modifier = Modifier
                                    .background(DarkSurfaceVariant.copy(alpha = 0.45f))
                                    .padding(10.dp)
                            ) {
                                if (block.language.isNotBlank()) {
                                    Text(
                                        text = block.language.uppercase(),
                                        color = TextCode.copy(alpha = 0.8f),
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 10.sp
                                    )
                                }
                                Text(
                                    text = block.value,
                                    color = TextCode,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 12.sp,
                                    lineHeight = 17.sp,
                                    modifier = Modifier.padding(top = if (block.language.isBlank()) 0.dp else 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}