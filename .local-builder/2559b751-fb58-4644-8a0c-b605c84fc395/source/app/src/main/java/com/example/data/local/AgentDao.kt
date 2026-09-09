package com.example.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.model.ActivityLog
import com.example.data.model.AgentSettings
import com.example.data.model.ChatMessage
import com.example.data.model.ProjectMemory
import kotlinx.coroutines.flow.Flow

@Dao
interface SettingsDao {
    @Query("SELECT * FROM agent_settings WHERE id = 1 LIMIT 1")
    fun getSettings(): Flow<AgentSettings?>

    @Query("SELECT * FROM agent_settings WHERE id = 1 LIMIT 1")
    suspend fun getSettingsSync(): AgentSettings?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveSettings(settings: AgentSettings)
}

@Dao
interface ProjectMemoryDao {
    @Query("SELECT * FROM project_memory WHERE id = 1 LIMIT 1")
    fun getProjectMemory(): Flow<ProjectMemory?>

    @Query("SELECT * FROM project_memory WHERE id = 1 LIMIT 1")
    suspend fun getProjectMemorySync(): ProjectMemory?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveProjectMemory(memory: ProjectMemory)

    @Update
    suspend fun updateProjectMemory(memory: ProjectMemory)
}

@Dao
interface ActivityLogDao {
    @Query("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100")
    fun getAllLogs(): Flow<List<ActivityLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: ActivityLog): Long

    @Query("DELETE FROM activity_logs")
    suspend fun clearLogs()
}

@Dao
interface ChatDao {
    @Query("SELECT * FROM chat_messages ORDER BY timestamp ASC")
    fun getAllMessages(): Flow<List<ChatMessage>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: ChatMessage): Long

    @Query("UPDATE chat_messages SET isApprovalGranted = :isGranted WHERE id = :messageId")
    suspend fun updateApproval(messageId: Long, isGranted: Boolean)

    @Query("DELETE FROM chat_messages")
    suspend fun clearChat()
}
