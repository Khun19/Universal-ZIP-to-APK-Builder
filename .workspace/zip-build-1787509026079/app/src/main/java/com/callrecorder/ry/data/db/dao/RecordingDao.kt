package com.callrecorder.ry.data.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.callrecorder.ry.data.db.entity.RecordingEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface RecordingDao {

    @Query("SELECT * FROM recordings ORDER BY callStartTime DESC")
    fun getAllRecordings(): Flow<List<RecordingEntity>>

    @Query("SELECT * FROM recordings WHERE phoneNumber = :phoneNumber ORDER BY callStartTime DESC")
    fun getRecordingsForNumber(phoneNumber: String): Flow<List<RecordingEntity>>

    @Query("SELECT * FROM recordings WHERE id = :id LIMIT 1")
    suspend fun getRecordingById(id: Long): RecordingEntity?

    @Query("SELECT * FROM recordings WHERE isBackedUp = 0 ORDER BY callStartTime ASC")
    suspend fun getPendingBackupRecordings(): List<RecordingEntity>

    @Query("SELECT * FROM recordings WHERE phoneNumber LIKE '%' || :query || '%' OR (contactName IS NOT NULL AND contactName LIKE '%' || :query || '%') ORDER BY callStartTime DESC")
    fun searchRecordings(query: String): Flow<List<RecordingEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecording(recording: RecordingEntity): Long

    @Update
    suspend fun updateRecording(recording: RecordingEntity)

    @Query("UPDATE recordings SET isBackedUp = 1 WHERE id = :id")
    suspend fun markAsBackedUp(id: Long)

    @Query("DELETE FROM recordings WHERE id = :id")
    suspend fun deleteRecordingById(id: Long)
}
