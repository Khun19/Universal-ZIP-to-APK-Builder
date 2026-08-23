package com.callrecorder.ry.util

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import java.util.Locale

object OemAutoStartHelper {

    fun isMiui(): Boolean = Build.MANUFACTURER.lowercase(Locale.ROOT).contains("xiaomi") ||
            Build.BRAND.lowercase(Locale.ROOT).contains("xiaomi") ||
            Build.BRAND.lowercase(Locale.ROOT).contains("redmi") ||
            Build.BRAND.lowercase(Locale.ROOT).contains("poco")

    fun isSamsung(): Boolean = Build.MANUFACTURER.lowercase(Locale.ROOT).contains("samsung") ||
            Build.BRAND.lowercase(Locale.ROOT).contains("samsung")

    fun isHuawei(): Boolean = Build.MANUFACTURER.lowercase(Locale.ROOT).contains("huawei") ||
            Build.BRAND.lowercase(Locale.ROOT).contains("huawei") ||
            Build.BRAND.lowercase(Locale.ROOT).contains("honor")

    fun isOppo(): Boolean = Build.MANUFACTURER.lowercase(Locale.ROOT).contains("oppo") ||
            Build.BRAND.lowercase(Locale.ROOT).contains("realme")

    fun isVivo(): Boolean = Build.MANUFACTURER.lowercase(Locale.ROOT).contains("vivo") ||
            Build.BRAND.lowercase(Locale.ROOT).contains("iqoo")

    fun getAutoStartIntent(context: Context): Intent? {
        val intent = when {
            isMiui() -> Intent().apply {
                component = ComponentName(
                    "com.miui.securitycenter",
                    "com.miui.permcenter.autostart.AutoStartManagementActivity"
                )
            }
            isSamsung() -> Intent().apply {
                component = ComponentName(
                    "com.samsung.android.lool",
                    "com.samsung.android.sm.battery.ui.BatteryActivity"
                )
            }
            isHuawei() -> Intent().apply {
                component = ComponentName(
                    "com.huawei.systemmanager",
                    "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"
                )
            }
            isOppo() -> Intent().apply {
                component = ComponentName(
                    "com.coloros.safecenter",
                    "com.coloros.safecenter.permission.startup.StartupAppListActivity"
                )
            }
            isVivo() -> Intent().apply {
                component = ComponentName(
                    "com.iqoo.secure",
                    "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"
                )
            }
            else -> null
        }

        return if (intent != null && isIntentAvailable(context, intent)) {
            intent
        } else {
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:${context.packageName}")
            }
        }
    }

    private fun isIntentAvailable(context: Context, intent: Intent): Boolean {
        val packageManager = context.packageManager
        val list = packageManager.queryIntentActivities(intent, 0)
        return list.isNotEmpty()
    }
}
