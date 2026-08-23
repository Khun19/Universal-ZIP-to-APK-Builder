package com.callrecorder.ry.ui.onboarding

import android.Manifest
import android.app.role.RoleManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.callrecorder.ry.R
import com.callrecorder.ry.data.datastore.AppPreferences
import com.callrecorder.ry.databinding.ActivityOnboardingPermissionBinding
import com.callrecorder.ry.domain.model.RecordingMode
import com.callrecorder.ry.ui.main.MainActivity
import com.callrecorder.ry.util.PermissionUtils
import kotlinx.coroutines.launch

class OnboardingPermissionActivity : AppCompatActivity() {

    private lateinit var binding: ActivityOnboardingPermissionBinding
    private var currentStep = 1

    private val requestRecordAudio = registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
        if (isGranted) moveToNextStep() else showRationaleOrNext()
    }

    private val requestPhoneState = registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
        if (isGranted) moveToNextStep() else showRationaleOrNext()
    }

    private val requestCallLog = registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
        if (isGranted) moveToNextStep() else showRationaleOrNext()
    }

    private val requestContacts = registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
        if (isGranted) moveToNextStep() else showRationaleOrNext()
    }

    private val requestNotifications = registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
        if (isGranted) moveToNextStep() else showRationaleOrNext()
    }

    private val requestRoleResult = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
        val isDialer = PermissionUtils.isDefaultDialerGranted(this)
        lifecycleScope.launch {
            AppPreferences(this@OnboardingPermissionActivity).setDefaultDialerGranted(isDialer)
        }
        moveToNextStep()
    }

    private val requestBatteryOpt = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
        moveToNextStep()
    }

    private val requestOverlay = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
        moveToNextStep()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityOnboardingPermissionBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupStepUI()
        setupListeners()
    }

    private fun setupListeners() {
        binding.btnGrantAction.setOnClickListener {
            handleGrantAction()
        }

        binding.btnSkipAction.setOnClickListener {
            moveToNextStep()
        }
    }

    private fun setupStepUI() {
        // Adjust for API versions if needed
        if (currentStep == 5 && Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            currentStep = 6
        }
        if (currentStep == 7 && Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            currentStep = 8
        }

        if (currentStep > 8) {
            completeOnboarding()
            return
        }

        binding.tvStepIndicator.text = getString(R.string.onboarding_step_format, currentStep, 8)

        when (currentStep) {
            1 -> {
                binding.ivOnboardingIcon.setImageResource(R.drawable.ic_mic)
                binding.tvStepTitle.text = getString(R.string.step_record_audio_title)
                binding.tvStepDesc.text = getString(R.string.step_record_audio_desc)
                binding.tvRationaleHeader.text = "Microphone Access"
                binding.tvRationaleBody.text = "Required to capture the audio feed during both incoming and outgoing phone calls."
                binding.btnSkipAction.visibility = View.GONE
            }
            2 -> {
                binding.ivOnboardingIcon.setImageResource(R.drawable.ic_phone)
                binding.tvStepTitle.text = getString(R.string.step_phone_state_title)
                binding.tvStepDesc.text = getString(R.string.step_phone_state_desc)
                binding.tvRationaleHeader.text = "Call Detection"
                binding.tvRationaleBody.text = "Used to detect when calls begin, connect, and disconnect so recording starts automatically."
                binding.btnSkipAction.visibility = View.GONE
            }
            3 -> {
                binding.ivOnboardingIcon.setImageResource(R.drawable.ic_history)
                binding.tvStepTitle.text = getString(R.string.step_call_log_title)
                binding.tvStepDesc.text = getString(R.string.step_call_log_desc)
                binding.tvRationaleHeader.text = "Call Metadata"
                binding.tvRationaleBody.text = "Associates incoming and outgoing phone numbers with recorded call files."
                binding.btnSkipAction.visibility = View.VISIBLE
            }
            4 -> {
                binding.ivOnboardingIcon.setImageResource(R.drawable.ic_contacts)
                binding.tvStepTitle.text = getString(R.string.step_contacts_title)
                binding.tvStepDesc.text = getString(R.string.step_contacts_desc)
                binding.tvRationaleHeader.text = "Contact Names"
                binding.tvRationaleBody.text = "Displays contact names instead of raw phone numbers in your call history timeline."
                binding.btnSkipAction.visibility = View.VISIBLE
            }
            5 -> {
                binding.ivOnboardingIcon.setImageResource(R.drawable.ic_notifications)
                binding.tvStepTitle.text = getString(R.string.step_notifications_title)
                binding.tvStepDesc.text = getString(R.string.step_notifications_desc)
                binding.tvRationaleHeader.text = "Status & Controls"
                binding.tvRationaleBody.text = "Displays active foreground recording status in your status bar during phone calls."
                binding.btnSkipAction.visibility = View.VISIBLE
            }
            6 -> {
                binding.ivOnboardingIcon.setImageResource(R.drawable.ic_battery)
                binding.tvStepTitle.text = getString(R.string.step_battery_title)
                binding.tvStepDesc.text = getString(R.string.step_battery_desc)
                binding.tvRationaleHeader.text = "Background Reliability"
                binding.tvRationaleBody.text = "Prevents Android OEM power managers from killing the recording engine during background calls."
                binding.btnSkipAction.visibility = View.VISIBLE
            }
            7 -> {
                binding.ivOnboardingIcon.setImageResource(R.drawable.ic_dialer)
                binding.tvStepTitle.text = getString(R.string.step_dialer_title)
                binding.tvStepDesc.text = getString(R.string.step_dialer_desc)
                binding.tvRationaleHeader.text = "Full 2-Way Audio"
                binding.tvRationaleBody.text = "Grants InCallService access to record crystal clear two-way audio on Android 10+ (API 29+)."
                binding.btnSkipAction.visibility = View.VISIBLE
            }
            8 -> {
                binding.ivOnboardingIcon.setImageResource(R.drawable.ic_overlay)
                binding.tvStepTitle.text = getString(R.string.step_overlay_title)
                binding.tvStepDesc.text = getString(R.string.step_overlay_desc)
                binding.tvRationaleHeader.text = "In-Call Floating Widget"
                binding.tvRationaleBody.text = "Shows a discreet on-screen recording badge during active phone conversations."
                binding.btnSkipAction.visibility = View.VISIBLE
            }
        }
    }

    private fun handleGrantAction() {
        when (currentStep) {
            1 -> requestRecordAudio.launch(Manifest.permission.RECORD_AUDIO)
            2 -> requestPhoneState.launch(Manifest.permission.READ_PHONE_STATE)
            3 -> requestCallLog.launch(Manifest.permission.READ_CALL_LOG)
            4 -> requestContacts.launch(Manifest.permission.READ_CONTACTS)
            5 -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    requestNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
                } else {
                    moveToNextStep()
                }
            }
            6 -> {
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:$packageName")
                    }
                    requestBatteryOpt.launch(intent)
                } catch (e: Exception) {
                    moveToNextStep()
                }
            }
            7 -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val roleManager = getSystemService(RoleManager::class.java)
                    if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_DIALER) &&
                        !roleManager.isRoleHeld(RoleManager.ROLE_DIALER)
                    ) {
                        val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_DIALER)
                        requestRoleResult.launch(intent)
                    } else {
                        moveToNextStep()
                    }
                } else {
                    moveToNextStep()
                }
            }
            8 -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    )
                    requestOverlay.launch(intent)
                } else {
                    moveToNextStep()
                }
            }
        }
    }

    private fun showRationaleOrNext() {
        Toast.makeText(this, "Permission declined. You can adjust this later in Settings.", Toast.LENGTH_SHORT).show()
        moveToNextStep()
    }

    private fun moveToNextStep() {
        currentStep++
        setupStepUI()
    }

    private fun completeOnboarding() {
        lifecycleScope.launch {
            val preferences = AppPreferences(this@OnboardingPermissionActivity)
            preferences.setOnboardingCompleted(true)

            val mode = PermissionUtils.determineRecordingMode(this@OnboardingPermissionActivity)
            preferences.setRecordingMode(mode)

            startActivity(Intent(this@OnboardingPermissionActivity, MainActivity::class.java))
            finish()
        }
    }
}
