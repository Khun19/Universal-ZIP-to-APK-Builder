package com.callrecorder.ry.ui.detail

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.FileProvider
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.callrecorder.ry.R
import com.callrecorder.ry.databinding.FragmentCallDetailTimelineBinding
import com.callrecorder.ry.domain.model.Recording
import com.callrecorder.ry.ui.player.AudioPlayerBottomSheetDialogFragment
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.io.File

class CallDetailTimelineFragment : Fragment() {

    private var _binding: FragmentCallDetailTimelineBinding? = null
    private val binding get() = _binding!!

    private val viewModel: CallDetailTimelineViewModel by viewModels()
    private lateinit var adapter: CallDetailTimelineAdapter

    private var phoneNumber: String = ""
    private var contactName: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            phoneNumber = it.getString("phoneNumber", "")
            contactName = it.getString("contactName")
        }
        viewModel.setPhoneNumber(phoneNumber)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCallDetailTimelineBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupToolbar()
        setupHeader()
        setupRecyclerView()
        observeTimeline()
    }

    private fun setupToolbar() {
        binding.toolbar.setNavigationOnClickListener {
            findNavController().navigateUp()
        }
    }

    private fun setupHeader() {
        val displayName = contactName ?: phoneNumber
        binding.tvTimelineContactName.text = displayName
        binding.tvTimelinePhoneNumber.text = phoneNumber
    }

    private fun setupRecyclerView() {
        adapter = CallDetailTimelineAdapter(
            onPlayClick = { recording -> showAudioPlayer(recording) },
            onShareClick = { recording -> shareRecording(recording) },
            onDeleteClick = { recording -> confirmDeleteRecording(recording) }
        )
        binding.rvTimeline.layoutManager = LinearLayoutManager(requireContext())
        binding.rvTimeline.adapter = adapter
    }

    private fun observeTimeline() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.timelineRecordings.collectLatest { list ->
                    adapter.submitList(list)
                    if (list.isEmpty()) {
                        binding.layoutEmptyTimeline.visibility = View.VISIBLE
                        binding.rvTimeline.visibility = View.GONE
                    } else {
                        binding.layoutEmptyTimeline.visibility = View.GONE
                        binding.rvTimeline.visibility = View.VISIBLE
                    }
                }
            }
        }
    }

    private fun showAudioPlayer(recording: Recording) {
        val playerDialog = AudioPlayerBottomSheetDialogFragment.newInstance(
            recordingId = recording.id,
            filePath = recording.recordingFilePath,
            contactName = recording.contactName,
            phoneNumber = recording.phoneNumber,
            callTime = recording.callStartTime,
            callDuration = recording.recordingDuration
        )
        playerDialog.show(parentFragmentManager, "AudioPlayerBottomSheet")
    }

    private fun shareRecording(recording: Recording) {
        try {
            val file = File(recording.recordingFilePath)
            if (!file.exists()) {
                Toast.makeText(requireContext(), "Audio file not found", Toast.LENGTH_SHORT).show()
                return
            }

            val uri: Uri = FileProvider.getUriForFile(
                requireContext(),
                "${requireContext().packageName}.fileprovider",
                file
            )

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "audio/*"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            startActivity(Intent.createChooser(shareIntent, "Share Call Recording"))
        } catch (e: Exception) {
            Toast.makeText(requireContext(), "Could not share: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun confirmDeleteRecording(recording: Recording) {
        MaterialAlertDialogBuilder(requireContext(), R.style.Theme_RyCallRecorder)
            .setTitle(R.string.dialog_delete_recording_title)
            .setMessage(R.string.dialog_delete_recording_msg)
            .setPositiveButton(R.string.dialog_delete_action) { _, _ ->
                viewModel.deleteRecording(recording)
            }
            .setNegativeButton(R.string.dialog_cancel_action, null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
