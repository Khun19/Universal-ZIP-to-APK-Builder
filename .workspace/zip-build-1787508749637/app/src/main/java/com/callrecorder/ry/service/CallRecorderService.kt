package com.callrecorder.ry.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.provider.CallLog
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.callrecorder.ry.R
import com.callrecorder.ry.data.datastore.AppPreferences
import com.callrecorder.ry.data.db.AppDatabase
import com.callrecorder.ry.data.repository.RecordingRepository
import com.callrecorder.ry.data.worker.UploadRecordingWorker
import com.callrecorder.ry.domain.model.Recording
import com.callrecorder.ry.domain.model.RecordingMode
import com.callrecorder.ry.service.recorder.RecordingEngine
import com.callrecorder.ry.service.recorder.RecordingEngineFactory
import com.callrecorder.ry.ui.main.MainActivity
import com.callrecorder.ry.util.FileUtils
import com.callrecorder.ry.util.PermissionUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.io.File

class CallRecorderService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var currentEngine: RecordingEngine? = null
    private var currentFile: File? = null
    private var callStartTime: Long = 0
    private var currentPhoneNumber: String = "Unknown"
    private var currentContactName: String? = null
    private var currentCallType: Int = CallLog.Calls.INCOMING_TYPE
    private var activeMode: RecordingMode = RecordingMode.MIC_ONLY_FALLBACK

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        when (action) {
            ACTION_START_RECORDING -> {
                val phoneNumber = intent.getStringExtra(EXTRA_PHONE_NUMBER) ?: "Unknown"
                val contactName = intent.getStringExtra(EXTRA_CONTACT_NAME)
                val callType = intent.getIntExtra(EXTRA_CALL_TYPE, CallLog.Calls.INCOMING_TYPE)
                
                // Immediately start foreground on main thread to satisfy Android FGS start contract
                val notification = buildForegroundNotification(phoneNumber, contactName)
                safeStartForeground(notification)
                
                startRecordingSession(phoneNumber, contactName, callType)
            }
            ACTION_STOP_RECORDING -> {
                stopRecordingSession()
            }
            else -> {
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun safeStartForeground(notification: Notification) {
        try {
            val hasRecordAudio = androidx.core.content.ContextCompat.checkSelfPermission(
                this,
                android.Manifest.permission.RECORD_AUDIO
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                if (hasRecordAudio) {
                    startForeground(
                        NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                    )
                } else {
                    startForeground(NOTIFICATION_ID, notification)
                }
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException starting foreground service: ${e.message}", e)
            try {
                startForeground(NOTIFICATION_ID, notification)
            } catch (e2: Exception) {
                Log.e(TAG, "Fallback startForeground failed: ${e2.message}", e2)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception starting foreground service: ${e.message}", e)
        }
    }

    private fun startRecordingSession(phoneNumber: String, contactName: String?, callType: Int) {
        serviceScope.launch {
            try {
                val repository = getRepository()
                // Check if number is excluded
                if (repository.isNumberExcluded(phoneNumber)) {
                    Log.d(TAG, "Phone number $phoneNumber is on exclude list. Skipping recording.")
                    stopRecordingSession()
                    return@launch
                }

                currentPhoneNumber = phoneNumber
                currentContactName = contactName
                currentCallType = callType
                callStartTime = System.currentTimeMillis()

                val preferences = AppPreferences(applicationContext)
                val savedMode = preferences.recordingMode.first()
                val detectedMode = PermissionUtils.determineRecordingMode(applicationContext)
                activeMode = if (detectedMode == RecordingMode.FULL) RecordingMode.FULL else savedMode

                val outputFile = FileUtils.generateRecordingFile(applicationContext, phoneNumber)
                currentFile = outputFile

                var engine = RecordingEngineFactory.createEngine(applicationContext, activeMode)
                var started = false
                try {
                    started = engine.startRecording(outputFile)
                } catch (e: Exception) {
                    Log.e(TAG, "Engine $activeMode failed to start: ${e.message}", e)
                }

                if (!started && activeMode != RecordingMode.MIC_ONLY_FALLBACK) {
                    Log.w(TAG, "Active mode failed, attempting Mic Fallback...")
                    activeMode = RecordingMode.MIC_ONLY_FALLBACK
                    try {
                        engine = RecordingEngineFactory.createEngine(applicationContext, activeMode)
                        started = engine.startRecording(outputFile)
                    } catch (e: Exception) {
                        Log.e(TAG, "Mic fallback engine failed to start: ${e.message}", e)
                    }
                }

                if (started) {
                    currentEngine = engine
                    Log.d(TAG, "Recording started successfully with mode $activeMode")
                } else {
                    Log.e(TAG, "Could not start any recording engine!")
                    stopRecordingSession()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in startRecordingSession: ${e.message}", e)
                stopRecordingSession()
            }
        }
    }

    private fun stopRecordingSession() {
        serviceScope.launch {
            try {
                currentEngine?.stopRecording()
                currentEngine = null

                val recordedFile = currentFile
                val endTime = System.currentTimeMillis()
                val durationMillis = if (callStartTime > 0) endTime - callStartTime else 0L

                if (recordedFile != null && recordedFile.exists() && recordedFile.length() > 0) {
                    val repository = getRepository()
                    val recording = Recording(
                        phoneNumber = currentPhoneNumber,
                        contactName = currentContactName,
                        callType = currentCallType,
                        callStartTime = callStartTime,
                        callDuration = durationMillis / 1000,
                        recordingFilePath = recordedFile.absolutePath,
                        recordingFileSize = recordedFile.length(),
                        recordingDuration = durationMillis,
                        recordingMode = activeMode,
                        isBackedUp = false,
                        createdAt = endTime
                    )
                    val insertedId = repository.insertRecording(recording)
                    Log.d(TAG, "Saved recording entity with id: $insertedId")

                    val preferences = AppPreferences(applicationContext)
                    val isAutoBackup = preferences.isAutoBackupEnabled.first()
                    if (isAutoBackup) {
                        val isWifiOnly = preferences.isBackupWifiOnly.first()
                        val networkType = if (isWifiOnly) NetworkType.UNMETERED else NetworkType.CONNECTED
                        val constraints = Constraints.Builder()
                            .setRequiredNetworkType(networkType)
                            .build()
                        val uploadWork = OneTimeWorkRequestBuilder<UploadRecordingWorker>()
                            .setConstraints(constraints)
                            .build()
                        WorkManager.getInstance(applicationContext).enqueue(uploadWork)
                        Log.d(TAG, "Enqueued automated cloud backup worker for recording $insertedId")
                    }
                } else {
                    Log.w(TAG, "Recorded file was empty or missing.")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error finalizing recording session: ${e.message}", e)
            } finally {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
                stopSelf()
            }
        }
    }

    private fun buildForegroundNotification(phoneNumber: String, contactName: String?): Notification {
        val displayName = contactName ?: phoneNumber
        val contentText = getString(R.string.notification_recording_body, displayName)

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.notification_recording_title))
            .setContentText(contentText)
            .setSmallIcon(R.drawable.ic_mic)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setColor(getColor(R.color.color_primary))
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_channel_desc)
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun getRepository(): RecordingRepository {
        val db = AppDatabase.getInstance(applicationContext)
        return RecordingRepository(db.recordingDao(), db.excludedNumberDao())
    }

    override fun onDestroy() {
        super.onDestroy()
        currentEngine?.stopRecording()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "CallRecorderService"
        const val CHANNEL_ID = "ry_call_recording_channel"
        const val NOTIFICATION_ID = 1001

        const val ACTION_START_RECORDING = "com.callrecorder.ry.action.START_RECORDING"
        const val ACTION_STOP_RECORDING = "com.callrecorder.ry.action.STOP_RECORDING"

        const val EXTRA_PHONE_NUMBER = "extra_phone_number"
        const val EXTRA_CONTACT_NAME = "extra_contact_name"
        const val EXTRA_CALL_TYPE = "extra_call_type"

        fun startRecording(context: Context, phoneNumber: String, contactName: String?, callType: Int) {
            val intent = Intent(context, CallRecorderService::class.java).apply {
                action = ACTION_START_RECORDING
                putExtra(EXTRA_PHONE_NUMBER, phoneNumber)
                putExtra(EXTRA_CONTACT_NAME, contactName)
                putExtra(EXTRA_CALL_TYPE, callType)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopRecording(context: Context) {
            val intent = Intent(context, CallRecorderService::class.java).apply {
                action = ACTION_STOP_RECORDING
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
    }
}
