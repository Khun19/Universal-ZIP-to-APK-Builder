package com.example.domain

import android.content.Context
import android.util.Log
import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * ProjectGoalLoader loads and manages the highest priority mission memory from PROJECT_GOAL.md.
 * It ensures the AI Software Engineer Agent strictly adheres to its supreme mission:
 * "Complete and improve Universal-ZIP-to-APK-Builder-main until it becomes a full universal ZIP to APK build system."
 */
class ProjectGoalLoader(private val context: Context) {

    private var cachedGoalContent: String = ""

    companion object {
        const val ASSET_FILE_NAME = "PROJECT_GOAL.md"
        private const val TAG = "ProjectGoalLoader"
    }

    init {
        loadGoal()
    }

    /**
     * Loads the PROJECT_GOAL.md from assets immediately at startup.
     */
    fun loadGoal(): String {
        return try {
            context.assets.open(ASSET_FILE_NAME).use { inputStream ->
                BufferedReader(InputStreamReader(inputStream)).use { reader ->
                    reader.readText().also { content ->
                        cachedGoalContent = content
                        Log.i(TAG, "Successfully loaded $ASSET_FILE_NAME (${content.length} chars) as highest priority mission memory.")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error loading $ASSET_FILE_NAME from assets", e)
            cachedGoalContent.ifBlank {
                "# PROJECT GOAL: Complete and improve Universal-ZIP-to-APK-Builder-main until it becomes a full universal ZIP to APK build system."
            }
        }
    }

    /**
     * Returns the raw PROJECT_GOAL.md content.
     */
    fun getProjectGoal(): String {
        if (cachedGoalContent.isBlank()) {
            loadGoal()
        }
        return cachedGoalContent
    }

    /**
     * Formats the mission prompt for inclusion as the highest priority memory in every Gemini Agent context.
     */
    fun getHighestPriorityMissionContext(): String {
        val goal = getProjectGoal()
        return """
            ================================================================================
            SUPREME MISSION DIRECTIVE (HIGHEST PRIORITY MISSION MEMORY - NON-NEGOTIABLE):
            ================================================================================
            $goal
            ================================================================================
        """.trimIndent()
    }
}
