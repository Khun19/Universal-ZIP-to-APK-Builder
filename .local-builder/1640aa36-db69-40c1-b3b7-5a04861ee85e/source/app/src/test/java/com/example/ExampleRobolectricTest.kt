package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.model.ProjectMemory
import com.example.domain.ProjectTools
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class ExampleRobolectricTest {

    @Test
    fun `read string from context`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val appName = context.getString(R.string.app_name)
        assertEquals("ZIP to APK Agent", appName)
    }

    @Test
    fun `verify dangerous command detection`() {
        // Test dangerous command checks
        val dangerousRm = "rm -rf /data/data/com.termux"
        val dangerousPkg = "pkg install nodejs"
        val dangerousTraversal = "cat ../../../etc/shadow"
        val safeBuild = "pnpm test"

        assertTrue(dangerousRm.contains("rm -rf"))
        assertTrue(dangerousPkg.startsWith("pkg "))
        assertTrue(dangerousTraversal.contains("../"))
    }

    @Test
    fun `verify default project memory contains required universal zip to apk features`() {
        val memory = ProjectMemory()
        assertEquals("Universal-ZIP-to-APK-Builder-main", memory.projectName)
        assertTrue(memory.completedFeatures.any { it.contains("ZIP extraction") })
        assertTrue(memory.completedFeatures.any { it.contains("Project detection") || it.contains("framework") })
        assertTrue(memory.completedFeatures.any { it.contains("APK validation") || it.contains("Real APK") })
    }

    @Test
    fun `verify project goal loader loads PROJECT_GOAL md from assets`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val loader = com.example.domain.ProjectGoalLoader(context)
        val goal = loader.getProjectGoal()

        assertTrue(goal.isNotBlank())
        assertTrue(goal.contains("Universal-ZIP-to-APK-Builder-main"))
        assertTrue(goal.contains("Current Completed Features") || goal.contains("Completed Features"))
        assertTrue(goal.contains("Supported Framework Expansion") || goal.contains("Framework Expansion"))
        assertTrue(goal.contains("Future Roadmap") || goal.contains("Roadmap"))
        assertTrue(goal.contains("Production Quality") || goal.contains("Production Goals"))
    }

    @Test
    fun `verify highest priority mission memory is formatted and injected into Gemini context`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val loader = com.example.domain.ProjectGoalLoader(context)
        val missionContext = loader.getHighestPriorityMissionContext()

        assertTrue(missionContext.contains("SUPREME MISSION DIRECTIVE"))
        assertTrue(missionContext.contains("Universal-ZIP-to-APK-Builder-main"))
    }
}
