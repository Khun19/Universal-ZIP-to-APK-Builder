package com.callrecorder.ry.ui.history

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.widget.Toast
import androidx.core.content.FileProvider
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.callrecorder.ry.R
import com.callrecorder.ry.databinding.FragmentCallHistoryBinding
import com.callrecorder.ry.domain.model.Recording
import com.callrecorder.ry.ui.player.AudioPlayerBottomSheetDialogFragment
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.io.File

class CallHistoryFragment : Fragment() {

    private var _binding: FragmentCallHistoryBinding? = null
    private val binding get() = _binding!!

    private val viewModel: CallHistoryViewModel by viewModels()
    private lateinit var adapter: CallHistoryAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCallHistoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupToolbar()
        setupRecyclerView()
        setupSearch()
        observeData()
    }

    private fun setupToolbar() {
        binding.toolbar.inflateMenu(R.menu.menu_call_history)
        binding.toolbar.setOnMenuItemClickListener { item ->
            when (item.itemId) {
                R.id.action_settings -> {
                    findNavController().navigate(R.id.nav_settings)
                    true
                }
                else -> false
            }
        }
    }

    private fun setupRecyclerView() {
        adapter = CallHistoryAdapter(
            onPlayClick = { recording -> showAudioPlayer(recording) },
            onTimelineClick = { recording -> openCallDetail(recording) },
            onShareClick = { recording -> shareRecording(recording) },
            onDeleteClick = { recording -> confirmDeleteRecording(recording) }
        )
        binding.rvRecordings.layoutManager = LinearLayoutManager(requireContext())
        binding.rvRecordings.adapter = adapter
        binding.rvRecordings.addOnScrollListener(object : RecyclerView.OnScrollListener() {
            override fun onScrollStateChanged(recyclerView: RecyclerView, newState: Int) {
                if (newState == RecyclerView.SCROLL_STATE_DRAGGING) {
                    hideKeyboard()
                }
            }
        })
    }

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                viewModel.setSearchQuery(s?.toString() ?: "")
            }
            override fun afterTextChanged(s: Editable?) {}
        })
    }

    private fun hideKeyboard() {
        val imm = requireContext().getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        view?.let { imm?.hideSoftInputFromWindow(it.windowToken, 0) }
        binding.etSearch.clearFocus()
    }

    private fun observeData() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.recordings.collectLatest { list ->
                    adapter.submitList(list)
                    if (list.isEmpty()) {
                        binding.layoutEmptyState.visibility = View.VISIBLE
                        binding.rvRecordings.visibility = View.GONE
                    } else {
                        binding.layoutEmptyState.visibility = View.GONE
                        binding.rvRecordings.visibility = View.VISIBLE
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

    private fun openCallDetail(recording: Recording) {
        val bundle = Bundle().apply {
            putString("phoneNumber", recording.phoneNumber)
            putString("contactName", recording.contactName)
        }
        findNavController().navigate(R.id.action_history_to_detail, bundle)
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
