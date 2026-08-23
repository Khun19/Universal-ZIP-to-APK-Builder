package com.callrecorder.ry.data.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.callrecorder.ry.data.db.AppDatabase
import com.callrecorder.ry.data.repository.RecordingRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class UploadRecordingWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "UploadRecordingWorker running backup...")
            val db = AppDatabase.getInstance(applicationContext)
            val repository = RecordingRepository(db.recordingDao(), db.excludedNumberDao())
            val pendingRecordings = repository.getPendingBackupRecordings()

            Log.d(TAG, "Found ${pendingRecordings.size} pending recordings to back up.")
            for (recording in pendingRecordings) {
                // Perform backup upload (simulation / Google Drive client)
                Log.d(TAG, "Simulating upload of recording ${recording.id} (${recording.phoneNumber}) to Cloud Storage")
                repository.markAsBackedUp(recording.id)
            }

            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error during upload worker: ${e.message}", e)
            Result.retry()
        }
    }

    companion object {
        private const val TAG = "UploadRecordingWorker"
        const val WORK_NAME = "ry_cloud_backup_work"
    }
}
