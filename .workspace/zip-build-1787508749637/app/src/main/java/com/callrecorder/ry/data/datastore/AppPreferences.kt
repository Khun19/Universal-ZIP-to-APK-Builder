package com.callrecorder.ry.data.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.callrecorder.ry.domain.model.RecordingMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "ry_preferences")

object PreferencesKeys {
    val IS_ONBOARDING_COMPLETED = booleanPreferencesKey("is_onboarding_completed")
    val IS_DEFAULT_DIALER_GRANTED = booleanPreferencesKey("is_default_dialer_granted")
    val RECORDING_MODE = stringPreferencesKey("recording_mode") // "FULL" | "LEGACY" | "MIC_ONLY_FALLBACK"
    val AUTO_BACKUP_ENABLED = booleanPreferencesKey("auto_backup_enabled")
    val BACKUP_WIFI_ONLY = booleanPreferencesKey("backup_wifi_only")
    val STORAGE_PATH = stringPreferencesKey("storage_path")
}

class AppPreferences(private val context: Context) {

    val isOnboardingCompleted: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.IS_ONBOARDING_COMPLETED] ?: false
    }

    val isDefaultDialerGranted: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.IS_DEFAULT_DIALER_GRANTED] ?: false
    }

    val recordingMode: Flow<RecordingMode> = context.dataStore.data.map { prefs ->
        val modeStr = prefs[PreferencesKeys.RECORDING_MODE] ?: RecordingMode.MIC_ONLY_FALLBACK.name
        try {
            RecordingMode.valueOf(modeStr)
        } catch (e: Exception) {
            RecordingMode.MIC_ONLY_FALLBACK
        }
    }

    val isAutoBackupEnabled: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.AUTO_BACKUP_ENABLED] ?: true
    }

    val isBackupWifiOnly: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.BACKUP_WIFI_ONLY] ?: true
    }

    val storagePath: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[PreferencesKeys.STORAGE_PATH] ?: (context.getExternalFilesDir(null)?.absolutePath ?: context.filesDir.absolutePath)
    }

    suspend fun setOnboardingCompleted(completed: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.IS_ONBOARDING_COMPLETED] = completed
        }
    }

    suspend fun setDefaultDialerGranted(granted: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.IS_DEFAULT_DIALER_GRANTED] = granted
        }
    }

    suspend fun setRecordingMode(mode: RecordingMode) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.RECORDING_MODE] = mode.name
        }
    }

    suspend fun setAutoBackupEnabled(enabled: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.AUTO_BACKUP_ENABLED] = enabled
        }
    }

    suspend fun setBackupWifiOnly(wifiOnly: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.BACKUP_WIFI_ONLY] = wifiOnly
        }
    }

    suspend fun setStoragePath(path: String) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.STORAGE_PATH] = path
        }
    }
}
