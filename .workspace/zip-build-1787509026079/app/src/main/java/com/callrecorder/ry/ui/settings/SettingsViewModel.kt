package com.callrecorder.ry.ui.settings

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.callrecorder.ry.data.datastore.AppPreferences
import com.callrecorder.ry.data.worker.UploadRecordingWorker
import com.callrecorder.ry.domain.model.RecordingMode
import com.callrecorder.ry.util.PermissionUtils
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SettingsViewModel(application: Application) : AndroidViewModel(application) {

    private val preferences = AppPreferences(application)

    val recordingMode: StateFlow<RecordingMode> = preferences.recordingMode
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), RecordingMode.MIC_ONLY_FALLBACK)

    val isAutoBackupEnabled: StateFlow<Boolean> = preferences.isAutoBackupEnabled
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)

    val isBackupWifiOnly: StateFlow<Boolean> = preferences.isBackupWifiOnly
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)

    val storagePath: StateFlow<String> = preferences.storagePath
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "")

    fun setAutoBackup(enabled: Boolean) {
        viewModelScope.launch {
            preferences.setAutoBackupEnabled(enabled)
        }
    }

    fun setBackupWifiOnly(wifiOnly: Boolean) {
        viewModelScope.launch {
            preferences.setBackupWifiOnly(wifiOnly)
        }
    }

    fun triggerImmediateBackup() {
        val networkType = if (isBackupWifiOnly.value) NetworkType.UNMETERED else NetworkType.CONNECTED
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(networkType)
            .build()

        val uploadWork = OneTimeWorkRequestBuilder<UploadRecordingWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(getApplication()).enqueue(uploadWork)
    }

    fun recheckRecordingMode() {
        val detected = PermissionUtils.determineRecordingMode(getApplication())
        viewModelScope.launch {
            preferences.setRecordingMode(detected)
        }
    }
}
