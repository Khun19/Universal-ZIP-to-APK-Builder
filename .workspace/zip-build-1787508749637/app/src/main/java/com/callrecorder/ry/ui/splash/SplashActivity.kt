package com.callrecorder.ry.ui.splash

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.callrecorder.ry.data.datastore.AppPreferences
import com.callrecorder.ry.databinding.ActivitySplashBinding
import com.callrecorder.ry.ui.main.MainActivity
import com.callrecorder.ry.ui.onboarding.OnboardingPermissionActivity
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySplashBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        lifecycleScope.launch {
            delay(1200) // Smooth entrance
            val preferences = AppPreferences(this@SplashActivity)
            val isOnboardingCompleted = preferences.isOnboardingCompleted.first()

            if (isOnboardingCompleted) {
                startActivity(Intent(this@SplashActivity, MainActivity::class.java))
            } else {
                startActivity(Intent(this@SplashActivity, OnboardingPermissionActivity::class.java))
            }
            finish()
        }
    }
}
