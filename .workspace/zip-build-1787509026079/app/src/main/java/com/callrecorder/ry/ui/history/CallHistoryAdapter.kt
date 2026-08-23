package com.callrecorder.ry.ui.history

import android.provider.CallLog
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.callrecorder.ry.R
import com.callrecorder.ry.databinding.ItemCallRecordingBinding
import com.callrecorder.ry.domain.model.Recording
import com.callrecorder.ry.util.FileUtils

class CallHistoryAdapter(
    private val onPlayClick: (Recording) -> Unit,
    private val onTimelineClick: (Recording) -> Unit,
    private val onShareClick: (Recording) -> Unit,
    private val onDeleteClick: (Recording) -> Unit
) : ListAdapter<Recording, CallHistoryAdapter.RecordingViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecordingViewHolder {
        val binding = ItemCallRecordingBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return RecordingViewHolder(binding)
    }

    override fun onBindViewHolder(holder: RecordingViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class RecordingViewHolder(
        private val binding: ItemCallRecordingBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(recording: Recording) {
            val context = binding.root.context

            val displayName = recording.contactName ?: recording.phoneNumber
            binding.tvContactOrNumber.text = displayName

            val callTypeStr = when (recording.callType) {
                CallLog.Calls.INCOMING_TYPE -> context.getString(R.string.call_incoming)
                CallLog.Calls.OUTGOING_TYPE -> context.getString(R.string.call_outgoing)
                CallLog.Calls.MISSED_TYPE -> context.getString(R.string.call_missed)
                else -> context.getString(R.string.call_incoming)
            }

            val callIconRes = when (recording.callType) {
                CallLog.Calls.INCOMING_TYPE -> R.drawable.ic_call_incoming
                CallLog.Calls.OUTGOING_TYPE -> R.drawable.ic_call_outgoing
                CallLog.Calls.MISSED_TYPE -> R.drawable.ic_call_missed
                else -> R.drawable.ic_call_incoming
            }
            binding.ivCallType.setImageResource(callIconRes)

            val durationFormatted = FileUtils.formatDuration(recording.recordingDuration)
            val subText = "$callTypeStr • $durationFormatted • ${recording.recordingMode.name}"
            binding.tvPhoneNumberSub.text = subText

            binding.tvCallTime.text = FileUtils.formatTimeOnly(recording.callStartTime)

            if (recording.isBackedUp) {
                binding.ivBackupStatus.visibility = View.VISIBLE
                binding.ivBackupStatus.setImageResource(R.drawable.ic_check_circle)
            } else {
                binding.ivBackupStatus.visibility = View.GONE
            }

            binding.btnPlayAudio.setOnClickListener {
                onPlayClick(recording)
            }

            binding.btnViewTimeline.setOnClickListener {
                onTimelineClick(recording)
            }

            binding.cardRecording.setOnClickListener {
                onTimelineClick(recording)
            }

            binding.btnShareRecording.setOnClickListener {
                onShareClick(recording)
            }

            binding.btnDeleteRecording.setOnClickListener {
                onDeleteClick(recording)
            }
        }
    }

    companion object DiffCallback : DiffUtil.ItemCallback<Recording>() {
        override fun areItemsTheSame(oldItem: Recording, newItem: Recording): Boolean =
            oldItem.id == newItem.id

        override fun areContentsTheSame(oldItem: Recording, newItem: Recording): Boolean =
            oldItem == newItem
    }
}
