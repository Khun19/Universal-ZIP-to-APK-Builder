package com.callrecorder.ry.ui.exclude

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.callrecorder.ry.data.db.AppDatabase
import com.callrecorder.ry.data.repository.RecordingRepository
import com.callrecorder.ry.domain.model.ExcludedNumber
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class ExcludeListViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: RecordingRepository
    val excludedNumbers: StateFlow<List<ExcludedNumber>>

    init {
        val db = AppDatabase.getInstance(application)
        repository = RecordingRepository(db.recordingDao(), db.excludedNumberDao())
        excludedNumbers = repository.getAllExcludedNumbers()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    }

    fun addExcludedNumber(phoneNumber: String, contactName: String?) {
        viewModelScope.launch {
            if (phoneNumber.isNotBlank()) {
                repository.addExcludedNumber(
                    ExcludedNumber(
                        phoneNumber = phoneNumber.trim(),
                        contactName = contactName?.trim()
                    )
                )
            }
        }
    }

    fun removeExcludedNumber(phoneNumber: String) {
        viewModelScope.launch {
            repository.removeExcludedNumber(phoneNumber)
        }
    }
}
