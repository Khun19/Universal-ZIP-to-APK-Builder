package com.callrecorder.ry.ui.detail

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.callrecorder.ry.data.db.AppDatabase
import com.callrecorder.ry.data.repository.RecordingRepository
import com.callrecorder.ry.domain.model.Recording
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@OptIn(ExperimentalCoroutinesApi::class)
class CallDetailTimelineViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: RecordingRepository
    private val phoneNumberFlow = MutableStateFlow("")

    val timelineRecordings: StateFlow<List<Recording>>

    init {
        val db = AppDatabase.getInstance(application)
        repository = RecordingRepository(db.recordingDao(), db.excludedNumberDao())

        timelineRecordings = phoneNumberFlow.flatMapLatest { phone ->
            if (phone.isBlank()) {
                repository.getAllRecordings()
            } else {
                repository.getRecordingsForNumber(phone)
            }
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    }

    fun setPhoneNumber(phoneNumber: String) {
        phoneNumberFlow.value = phoneNumber
    }

    fun deleteRecording(recording: Recording) {
        viewModelScope.launch {
            repository.deleteRecording(recording)
        }
    }
}
