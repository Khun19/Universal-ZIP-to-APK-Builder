package com.callrecorder.ry.data.repository

import com.callrecorder.ry.data.db.dao.ExcludedNumberDao
import com.callrecorder.ry.data.db.dao.RecordingDao
import com.callrecorder.ry.data.db.entity.ExcludedNumberEntity
import com.callrecorder.ry.data.db.entity.RecordingEntity
import com.callrecorder.ry.domain.model.ExcludedNumber
import com.callrecorder.ry.domain.model.Recording
import com.callrecorder.ry.domain.model.RecordingMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.io.File

class RecordingRepository(
    private val recordingDao: RecordingDao,
    private val excludedNumberDao: ExcludedNumberDao
) {

    fun getAllRecordings(): Flow<List<Recording>> {
        return recordingDao.getAllRecordings().map { list ->
            list.map { it.toDomain() }
        }
    }

    fun getRecordingsForNumber(phoneNumber: String): Flow<List<Recording>> {
        return recordingDao.getRecordingsForNumber(phoneNumber).map { list ->
            list.map { it.toDomain() }
        }
    }

    fun searchRecordings(query: String): Flow<List<Recording>> {
        return recordingDao.searchRecordings(query).map { list ->
            list.map { it.toDomain() }
        }
    }

    suspend fun getRecordingById(id: Long): Recording? {
        return recordingDao.getRecordingById(id)?.toDomain()
    }

    suspend fun getPendingBackupRecordings(): List<Recording> {
        return recordingDao.getPendingBackupRecordings().map { it.toDomain() }
    }

    suspend fun insertRecording(recording: Recording): Long {
        return recordingDao.insertRecording(recording.toEntity())
    }

    suspend fun markAsBackedUp(id: Long) {
        recordingDao.markAsBackedUp(id)
    }

    suspend fun deleteRecording(recording: Recording) {
        val file = File(recording.recordingFilePath)
        if (file.exists()) {
            file.delete()
        }
        recordingDao.deleteRecordingById(recording.id)
    }

    fun getAllExcludedNumbers(): Flow<List<ExcludedNumber>> {
        return excludedNumberDao.getAllExcludedNumbers().map { list ->
            list.map { it.toDomain() }
        }
    }

    suspend fun isNumberExcluded(phoneNumber: String): Boolean {
        return excludedNumberDao.isNumberExcluded(phoneNumber)
    }

    suspend fun addExcludedNumber(excludedNumber: ExcludedNumber) {
        excludedNumberDao.insertExcludedNumber(excludedNumber.toEntity())
    }

    suspend fun removeExcludedNumber(phoneNumber: String) {
        excludedNumberDao.deleteExcludedNumber(phoneNumber)
    }

    private fun RecordingEntity.toDomain(): Recording {
        val mode = try {
            RecordingMode.valueOf(recordingMode)
        } catch (e: Exception) {
            RecordingMode.MIC_ONLY_FALLBACK
        }
        return Recording(
            id = id,
            phoneNumber = phoneNumber,
            contactName = contactName,
            callType = callType,
            callStartTime = callStartTime,
            callDuration = callDuration,
            recordingFilePath = recordingFilePath,
            recordingFileSize = recordingFileSize,
            recordingDuration = recordingDuration,
            recordingMode = mode,
            isBackedUp = isBackedUp,
            createdAt = createdAt
        )
    }

    private fun Recording.toEntity(): RecordingEntity {
        return RecordingEntity(
            id = id,
            phoneNumber = phoneNumber,
            contactName = contactName,
            callType = callType,
            callStartTime = callStartTime,
            callDuration = callDuration,
            recordingFilePath = recordingFilePath,
            recordingFileSize = recordingFileSize,
            recordingDuration = recordingDuration,
            recordingMode = recordingMode.name,
            isBackedUp = isBackedUp,
            createdAt = createdAt
        )
    }

    private fun ExcludedNumberEntity.toDomain(): ExcludedNumber {
        return ExcludedNumber(
            phoneNumber = phoneNumber,
            contactName = contactName,
            addedAt = addedAt
        )
    }

    private fun ExcludedNumber.toEntity(): ExcludedNumberEntity {
        return ExcludedNumberEntity(
            phoneNumber = phoneNumber,
            contactName = contactName,
            addedAt = addedAt
        )
    }
}
