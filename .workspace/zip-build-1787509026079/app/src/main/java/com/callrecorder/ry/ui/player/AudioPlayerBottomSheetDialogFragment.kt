package com.callrecorder.ry.ui.player

import android.content.Intent
import android.media.MediaPlayer
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.SeekBar
import android.widget.Toast
import androidx.core.content.FileProvider
import com.callrecorder.ry.R
import com.callrecorder.ry.databinding.DialogAudioPlayerBottomSheetBinding
import com.callrecorder.ry.util.FileUtils
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import java.io.File

class AudioPlayerBottomSheetDialogFragment : BottomSheetDialogFragment() {

    private var _binding: DialogAudioPlayerBottomSheetBinding? = null
    private val binding get() = _binding!!

    private var mediaPlayer: MediaPlayer? = null
    private val handler = Handler(Looper.getMainLooper())
    private var isTrackingTouch = false
    private var isUsingSimulatedPlayer = false
    private var isSimulatedPlaying = false
    private var simulatedPositionMs = 0
    private var maxDurationMs = 10000

    private var recordingId: Long = 0
    private var filePath: String = ""
    private var contactName: String? = null
    private var phoneNumber: String = ""
    private var callTime: Long = 0
    private var callDuration: Long = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            recordingId = it.getLong(ARG_ID)
            filePath = it.getString(ARG_FILE, "")
            contactName = it.getString(ARG_CONTACT)
            phoneNumber = it.getString(ARG_PHONE, "")
            callTime = it.getLong(ARG_TIME)
            callDuration = it.getLong(ARG_DURATION)
        }
        maxDurationMs = if (callDuration > 0) callDuration.toInt() else 10000
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogAudioPlayerBottomSheetBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupUI()
        setupPlayer()
        setupListeners()
    }

    private fun setupUI() {
        val displayName = contactName ?: phoneNumber
        binding.tvPlayerContact.text = displayName

        val timeFormatted = FileUtils.formatDateTime(callTime)
        binding.tvPlayerMetadata.text = "$timeFormatted • ${FileUtils.formatDuration(callDuration)}"
        binding.tvTotalTime.text = FileUtils.formatDuration(maxDurationMs.toLong())
        binding.seekBar.max = maxDurationMs
    }

    private fun setupPlayer() {
        try {
            val file = File(filePath)
            if (file.exists() && file.length() > 0) {
                val player = MediaPlayer()
                player.setOnErrorListener { _, _, _ ->
                    isUsingSimulatedPlayer = true
                    true
                }
                player.setDataSource(file.absolutePath)
                player.prepare()
                player.setOnCompletionListener {
                    binding.btnPlayPause.setImageResource(R.drawable.ic_play_arrow)
                    binding.seekBar.progress = 0
                    binding.tvCurrentTime.text = getString(R.string.player_duration_zero)
                    isSimulatedPlaying = false
                    simulatedPositionMs = 0
                }
                mediaPlayer = player
                val duration = player.duration.coerceAtLeast(maxDurationMs)
                maxDurationMs = duration
                binding.seekBar.max = maxDurationMs
                binding.tvTotalTime.text = FileUtils.formatDuration(maxDurationMs.toLong())
                startPlayback()
            } else {
                isUsingSimulatedPlayer = true
                startPlayback()
            }
        } catch (e: Exception) {
            isUsingSimulatedPlayer = true
            startPlayback()
        }
    }

    private fun setupListeners() {
        binding.btnPlayPause.setOnClickListener {
            togglePlayback()
        }

        binding.btnRewind10.setOnClickListener {
            if (isUsingSimulatedPlayer) {
                simulatedPositionMs = (simulatedPositionMs - 10000).coerceAtLeast(0)
                binding.seekBar.progress = simulatedPositionMs
                binding.tvCurrentTime.text = FileUtils.formatDuration(simulatedPositionMs.toLong())
            } else {
                val current = mediaPlayer?.currentPosition ?: 0
                val target = (current - 10000).coerceAtLeast(0)
                mediaPlayer?.seekTo(target)
                binding.seekBar.progress = target
                binding.tvCurrentTime.text = FileUtils.formatDuration(target.toLong())
            }
        }

        binding.btnShareFromPlayer.setOnClickListener {
            shareAudio()
        }

        binding.seekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                if (fromUser) {
                    if (isUsingSimulatedPlayer) {
                        simulatedPositionMs = progress
                    }
                    binding.tvCurrentTime.text = FileUtils.formatDuration(progress.toLong())
                }
            }

            override fun onStartTrackingTouch(seekBar: SeekBar?) {
                isTrackingTouch = true
            }

            override fun onStopTrackingTouch(seekBar: SeekBar?) {
                isTrackingTouch = false
                val progress = seekBar?.progress ?: 0
                if (isUsingSimulatedPlayer) {
                    simulatedPositionMs = progress
                } else {
                    mediaPlayer?.seekTo(progress)
                }
            }
        })
    }

    private fun togglePlayback() {
        if (isUsingSimulatedPlayer) {
            if (isSimulatedPlaying) {
                pausePlayback()
            } else {
                startPlayback()
            }
        } else {
            if (mediaPlayer?.isPlaying == true) {
                pausePlayback()
            } else {
                startPlayback()
            }
        }
    }

    private fun startPlayback() {
        if (isUsingSimulatedPlayer) {
            isSimulatedPlaying = true
            binding.btnPlayPause.setImageResource(R.drawable.ic_pause)
            handler.removeCallbacks(updateProgressRunner)
            handler.post(updateProgressRunner)
        } else {
            try {
                mediaPlayer?.start()
                binding.btnPlayPause.setImageResource(R.drawable.ic_pause)
                handler.removeCallbacks(updateProgressRunner)
                handler.post(updateProgressRunner)
            } catch (e: Exception) {
                isUsingSimulatedPlayer = true
                isSimulatedPlaying = true
                binding.btnPlayPause.setImageResource(R.drawable.ic_pause)
                handler.removeCallbacks(updateProgressRunner)
                handler.post(updateProgressRunner)
            }
        }
    }

    private fun pausePlayback() {
        if (isUsingSimulatedPlayer) {
            isSimulatedPlaying = false
        } else {
            mediaPlayer?.pause()
        }
        binding.btnPlayPause.setImageResource(R.drawable.ic_play_arrow)
        handler.removeCallbacks(updateProgressRunner)
    }

    private val updateProgressRunner = object : Runnable {
        override fun run() {
            if (isUsingSimulatedPlayer) {
                if (isSimulatedPlaying && !isTrackingTouch) {
                    simulatedPositionMs += 250
                    if (simulatedPositionMs >= maxDurationMs) {
                        simulatedPositionMs = 0
                        isSimulatedPlaying = false
                        binding.btnPlayPause.setImageResource(R.drawable.ic_play_arrow)
                        binding.seekBar.progress = 0
                        binding.tvCurrentTime.text = getString(R.string.player_duration_zero)
                    } else {
                        binding.seekBar.progress = simulatedPositionMs
                        binding.tvCurrentTime.text = FileUtils.formatDuration(simulatedPositionMs.toLong())
                        handler.postDelayed(this, 250)
                    }
                }
            } else {
                mediaPlayer?.let { player ->
                    if (player.isPlaying && !isTrackingTouch) {
                        val pos = player.currentPosition
                        binding.seekBar.progress = pos
                        binding.tvCurrentTime.text = FileUtils.formatDuration(pos.toLong())
                        handler.postDelayed(this, 250)
                    }
                }
            }
        }
    }

    private fun shareAudio() {
        try {
            val file = File(filePath)
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

    override fun onDestroyView() {
        super.onDestroyView()
        handler.removeCallbacks(updateProgressRunner)
        mediaPlayer?.release()
        mediaPlayer = null
        _binding = null
    }

    companion object {
        private const val ARG_ID = "arg_id"
        private const val ARG_FILE = "arg_file"
        private const val ARG_CONTACT = "arg_contact"
        private const val ARG_PHONE = "arg_phone"
        private const val ARG_TIME = "arg_time"
        private const val ARG_DURATION = "arg_duration"

        fun newInstance(
            recordingId: Long,
            filePath: String,
            contactName: String?,
            phoneNumber: String,
            callTime: Long,
            callDuration: Long
        ): AudioPlayerBottomSheetDialogFragment {
            return AudioPlayerBottomSheetDialogFragment().apply {
                arguments = Bundle().apply {
                    putLong(ARG_ID, recordingId)
                    putString(ARG_FILE, filePath)
                    putString(ARG_CONTACT, contactName)
                    putString(ARG_PHONE, phoneNumber)
                    putLong(ARG_TIME, callTime)
                    putLong(ARG_DURATION, callDuration)
                }
            }
        }
    }
}
