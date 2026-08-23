package com.callrecorder.ry.ui.history

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
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@OptIn(ExperimentalCoroutinesApi::class)
class CallHistoryViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: RecordingRepository

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val recordings: StateFlow<List<Recording>>

    init {
        val db = AppDatabase.getInstance(application)
        repository = RecordingRepository(db.recordingDao(), db.excludedNumberDao())

        recordings = _searchQuery.flatMapLatest { query ->
            if (query.isBlank()) {
                repository.getAllRecordings()
            } else {
                repository.searchRecordings(query)
            }
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun deleteRecording(recording: Recording) {
        viewModelScope.launch {
            repository.deleteRecording(recording)
        }
    }
}
