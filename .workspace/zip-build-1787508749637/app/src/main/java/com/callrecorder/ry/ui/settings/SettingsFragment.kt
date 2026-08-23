package com.callrecorder.ry.ui.settings

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.callrecorder.ry.R
import com.callrecorder.ry.databinding.FragmentSettingsBinding
import com.callrecorder.ry.domain.model.RecordingMode
import com.callrecorder.ry.ui.onboarding.OnboardingPermissionActivity
import com.callrecorder.ry.util.FileUtils
import com.callrecorder.ry.util.OemAutoStartHelper
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class SettingsFragment : Fragment() {

    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    private val viewModel: SettingsViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupListeners()
        observeData()
        displayStoragePath()
    }

    private fun displayStoragePath() {
        val dir = FileUtils.getRecordingsDirectory(requireContext())
        binding.tvStoragePath.text = dir.absolutePath
    }

    private fun setupListeners() {
        binding.btnRecheckPermissions.setOnClickListener {
            val intent = Intent(requireContext(), OnboardingPermissionActivity::class.java)
            startActivity(intent)
        }

        binding.switchAutoBackup.setOnCheckedChangeListener { _, isChecked ->
            viewModel.setAutoBackup(isChecked)
        }

        binding.switchWifiOnly.setOnCheckedChangeListener { _, isChecked ->
            viewModel.setBackupWifiOnly(isChecked)
        }

        binding.btnTriggerBackup.setOnClickListener {
            viewModel.triggerImmediateBackup()
            Toast.makeText(requireContext(), "Backup scheduled in background", Toast.LENGTH_SHORT).show()
        }

        binding.btnOpenOemSettings.setOnClickListener {
            val intent = OemAutoStartHelper.getAutoStartIntent(requireContext())
            if (intent != null) {
                try {
                    startActivity(intent)
                } catch (e: Exception) {
                    Toast.makeText(requireContext(), "Could not open OEM autostart settings", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun observeData() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                launch {
                    viewModel.recordingMode.collectLatest { mode ->
                        binding.tvActiveModeLabel.text = "Mode: ${mode.displayName}"
                        when (mode) {
                            RecordingMode.FULL -> {
                                binding.tvActiveModeDesc.text = "Full 2-way audio captured via InCallService / Dialer role."
                            }
                            RecordingMode.LEGACY -> {
                                binding.tvActiveModeDesc.text = "Direct Voice Call source on Android 6–9."
                            }
                            RecordingMode.MIC_ONLY_FALLBACK -> {
                                binding.tvActiveModeDesc.text = "Standard microphone audio feed. Enable Dialer role for 2-way audio."
                            }
                        }
                    }
                }

                launch {
                    viewModel.isAutoBackupEnabled.collectLatest { enabled ->
                        if (binding.switchAutoBackup.isChecked != enabled) {
                            binding.switchAutoBackup.isChecked = enabled
                        }
                    }
                }

                launch {
                    viewModel.isBackupWifiOnly.collectLatest { wifiOnly ->
                        if (binding.switchWifiOnly.isChecked != wifiOnly) {
                            binding.switchWifiOnly.isChecked = wifiOnly
                        }
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.recheckRecordingMode()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
