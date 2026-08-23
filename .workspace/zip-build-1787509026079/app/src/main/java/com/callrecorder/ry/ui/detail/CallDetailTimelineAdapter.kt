package com.callrecorder.ry.ui.detail

import android.provider.CallLog
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.callrecorder.ry.R
import com.callrecorder.ry.databinding.ItemTimelineRecordingBinding
import com.callrecorder.ry.domain.model.Recording
import com.callrecorder.ry.util.FileUtils

class CallDetailTimelineAdapter(
    private val onPlayClick: (Recording) -> Unit,
    private val onShareClick: (Recording) -> Unit,
    private val onDeleteClick: (Recording) -> Unit
) : ListAdapter<Recording, CallDetailTimelineAdapter.TimelineViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TimelineViewHolder {
        val binding = ItemTimelineRecordingBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return TimelineViewHolder(binding)
    }

    override fun onBindViewHolder(holder: TimelineViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class TimelineViewHolder(
        private val binding: ItemTimelineRecordingBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(recording: Recording) {
            val context = binding.root.context
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
            binding.ivTimelineCallType.setImageResource(callIconRes)

            binding.tvTimelineDateTime.text = FileUtils.formatDateTime(recording.callStartTime)
            binding.tvTimelineDuration.text = FileUtils.formatDuration(recording.recordingDuration)

            val sizeStr = FileUtils.formatFileSize(recording.recordingFileSize)
            val backupStr = if (recording.isBackedUp) "Backed up" else "Local only"
            binding.tvTimelineMeta.text = "${recording.recordingMode.displayName} • $sizeStr • $backupStr"

            binding.btnTimelinePlay.setOnClickListener {
                onPlayClick(recording)
            }

            binding.btnTimelineShare.setOnClickListener {
                onShareClick(recording)
            }

            binding.btnTimelineDelete.setOnClickListener {
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
