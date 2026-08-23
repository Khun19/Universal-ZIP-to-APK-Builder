package com.callrecorder.ry.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.provider.CallLog
import android.provider.ContactsContract
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.util.Log
import androidx.annotation.RequiresApi
import java.util.concurrent.Executors

class CallDetectionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        Log.d(TAG, "onReceive: action = $action")

        if (action == Intent.ACTION_NEW_OUTGOING_CALL) {
            val outgoingNumber = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER) ?: ""
            lastOutgoingNumber = outgoingNumber
            return
        }

        if (action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val stateStr = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

            val state = when (stateStr) {
                TelephonyManager.EXTRA_STATE_IDLE -> TelephonyManager.CALL_STATE_IDLE
                TelephonyManager.EXTRA_STATE_RINGING -> TelephonyManager.CALL_STATE_RINGING
                TelephonyManager.EXTRA_STATE_OFFHOOK -> TelephonyManager.CALL_STATE_OFFHOOK
                else -> TelephonyManager.CALL_STATE_IDLE
            }

            handleCallState(context, state, incomingNumber)
        }
    }

    companion object {
        private const val TAG = "CallDetectionReceiver"
        private var lastState = TelephonyManager.CALL_STATE_IDLE
        private var isIncoming = false
        private var savedNumber: String? = null
        private var lastOutgoingNumber: String? = null

        fun handleCallState(context: Context, state: Int, phoneNumber: String?) {
            if (lastState == state) {
                return
            }

            val number = phoneNumber ?: savedNumber ?: lastOutgoingNumber ?: "Unknown"

            when (state) {
                TelephonyManager.CALL_STATE_RINGING -> {
                    isIncoming = true
                    savedNumber = phoneNumber
                    Log.d(TAG, "Incoming call ringing from: $number")
                }
                TelephonyManager.CALL_STATE_OFFHOOK -> {
                    if (lastState == TelephonyManager.CALL_STATE_RINGING) {
                        // Incoming call answered
                        isIncoming = true
                        val contactName = getContactName(context, number)
                        Log.d(TAG, "Incoming call offhook from: $number ($contactName). Starting recording.")
                        if (androidx.core.content.ContextCompat.checkSelfPermission(
                                context,
                                android.Manifest.permission.RECORD_AUDIO
                            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
                        ) {
                            CallRecorderService.startRecording(
                                context,
                                number,
                                contactName,
                                CallLog.Calls.INCOMING_TYPE
                            )
                        } else {
                            Log.w(TAG, "RECORD_AUDIO permission missing; skipping call recording.")
                        }
                    } else {
                        // Outgoing call started
                        isIncoming = false
                        val outNumber = savedNumber ?: lastOutgoingNumber ?: number
                        val contactName = getContactName(context, outNumber)
                        Log.d(TAG, "Outgoing call offhook to: $outNumber ($contactName). Starting recording.")
                        if (androidx.core.content.ContextCompat.checkSelfPermission(
                                context,
                                android.Manifest.permission.RECORD_AUDIO
                            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
                        ) {
                            CallRecorderService.startRecording(
                                context,
                                outNumber,
                                contactName,
                                CallLog.Calls.OUTGOING_TYPE
                            )
                        } else {
                            Log.w(TAG, "RECORD_AUDIO permission missing; skipping call recording.")
                        }
                    }
                }
                TelephonyManager.CALL_STATE_IDLE -> {
                    if (lastState == TelephonyManager.CALL_STATE_OFFHOOK) {
                        Log.d(TAG, "Call ended. Stopping recording.")
                        CallRecorderService.stopRecording(context)
                    }
                    isIncoming = false
                    savedNumber = null
                    lastOutgoingNumber = null
                }
            }
            lastState = state
        }

        fun registerTelephonyListener(context: Context) {
            val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager ?: return
            val executor = Executors.newSingleThreadExecutor()

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                telephonyManager.registerTelephonyCallback(
                    executor,
                    @RequiresApi(Build.VERSION_CODES.S)
                    object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                        override fun onCallStateChanged(state: Int) {
                            handleCallState(context, state, null)
                        }
                    }
                )
            } else {
                @Suppress("DEPRECATION")
                telephonyManager.listen(
                    object : PhoneStateListener() {
                        @Deprecated("Deprecated in API 31")
                        override fun onCallStateChanged(state: Int, incomingNumber: String?) {
                            handleCallState(context, state, incomingNumber)
                        }
                    },
                    @Suppress("DEPRECATION")
                    PhoneStateListener.LISTEN_CALL_STATE
                )
            }
        }

        private fun getContactName(context: Context, phoneNumber: String): String? {
            if (phoneNumber.isEmpty() || phoneNumber == "Unknown") return null
            val uri = Uri.withAppendedPath(
                ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                Uri.encode(phoneNumber)
            )
            val projection = arrayOf(ContactsContract.PhoneLookup.DISPLAY_NAME)
            var cursor: Cursor? = null
            return try {
                cursor = context.contentResolver.query(uri, projection, null, null, null)
                if (cursor != null && cursor.moveToFirst()) {
                    val nameIndex = cursor.getColumnIndex(ContactsContract.PhoneLookup.DISPLAY_NAME)
                    if (nameIndex != -1) cursor.getString(nameIndex) else null
                } else {
                    null
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error looking up contact name: ${e.message}")
                null
            } finally {
                cursor?.close()
            }
        }
    }
}
