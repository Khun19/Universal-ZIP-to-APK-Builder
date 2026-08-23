package com.callrecorder.ry.service.recorder

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import com.callrecorder.ry.domain.model.RecordingMode
import java.io.File

interface RecordingEngine {
    val mode: RecordingMode
    fun startRecording(outputFile: File): Boolean
    fun stopRecording(): Boolean
    fun isRecording(): Boolean
}

class FullRecordingEngine(private val context: Context) : RecordingEngine {
    override val mode: RecordingMode = RecordingMode.FULL
    private var mediaRecorder: MediaRecorder? = null
    private var isRecordingActive = false

    override fun startRecording(outputFile: File): Boolean {
        return try {
            val recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            // AudioSource.VOICE_CALL (4) is used when default dialer role is held or InCallService audio stream is routed
            recorder.setAudioSource(MediaRecorder.AudioSource.VOICE_CALL)
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            recorder.setAudioEncodingBitRate(128000)
            recorder.setAudioSamplingRate(44100)
            recorder.setOutputFile(outputFile.absolutePath)
            recorder.prepare()
            recorder.start()

            mediaRecorder = recorder
            isRecordingActive = true
            Log.d("FullRecordingEngine", "Full recording started to ${outputFile.absolutePath}")
            true
        } catch (e: Exception) {
            Log.e("FullRecordingEngine", "Failed to start full recording, falling back: ${e.message}", e)
            mediaRecorder?.release()
            mediaRecorder = null
            isRecordingActive = false
            false
        }
    }

    override fun stopRecording(): Boolean {
        return try {
            if (isRecordingActive && mediaRecorder != null) {
                mediaRecorder?.stop()
                mediaRecorder?.reset()
                mediaRecorder?.release()
                mediaRecorder = null
                isRecordingActive = false
                Log.d("FullRecordingEngine", "Recording stopped successfully")
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e("FullRecordingEngine", "Error stopping recording: ${e.message}", e)
            mediaRecorder?.release()
            mediaRecorder = null
            isRecordingActive = false
            false
        }
    }

    override fun isRecording(): Boolean = isRecordingActive
}

class LegacyRecordingEngine(private val context: Context) : RecordingEngine {
    override val mode: RecordingMode = RecordingMode.LEGACY
    private var mediaRecorder: MediaRecorder? = null
    private var isRecordingActive = false

    override fun startRecording(outputFile: File): Boolean {
        return try {
            @Suppress("DEPRECATION")
            val recorder = MediaRecorder()
            recorder.setAudioSource(MediaRecorder.AudioSource.VOICE_CALL)
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            recorder.setAudioEncodingBitRate(96000)
            recorder.setAudioSamplingRate(44100)
            recorder.setOutputFile(outputFile.absolutePath)
            recorder.prepare()
            recorder.start()

            mediaRecorder = recorder
            isRecordingActive = true
            Log.d("LegacyRecordingEngine", "Legacy recording started")
            true
        } catch (e: Exception) {
            Log.e("LegacyRecordingEngine", "Failed to start legacy recording: ${e.message}", e)
            mediaRecorder?.release()
            mediaRecorder = null
            isRecordingActive = false
            false
        }
    }

    override fun stopRecording(): Boolean {
        return try {
            if (isRecordingActive && mediaRecorder != null) {
                mediaRecorder?.stop()
                mediaRecorder?.reset()
                mediaRecorder?.release()
                mediaRecorder = null
                isRecordingActive = false
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e("LegacyRecordingEngine", "Error stopping legacy recording: ${e.message}", e)
            mediaRecorder?.release()
            mediaRecorder = null
            isRecordingActive = false
            false
        }
    }

    override fun isRecording(): Boolean = isRecordingActive
}

class MicFallbackRecordingEngine(private val context: Context) : RecordingEngine {
    override val mode: RecordingMode = RecordingMode.MIC_ONLY_FALLBACK
    private var mediaRecorder: MediaRecorder? = null
    private var isRecordingActive = false

    override fun startRecording(outputFile: File): Boolean {
        return try {
            val recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            recorder.setAudioSource(MediaRecorder.AudioSource.MIC)
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            recorder.setAudioEncodingBitRate(128000)
            recorder.setAudioSamplingRate(44100)
            recorder.setOutputFile(outputFile.absolutePath)
            recorder.prepare()
            recorder.start()

            mediaRecorder = recorder
            isRecordingActive = true
            Log.d("MicFallbackEngine", "Mic fallback recording started")
            true
        } catch (e: Exception) {
            Log.e("MicFallbackEngine", "Failed to start mic fallback recording: ${e.message}", e)
            mediaRecorder?.release()
            mediaRecorder = null
            isRecordingActive = false
            false
        }
    }

    override fun stopRecording(): Boolean {
        return try {
            if (isRecordingActive && mediaRecorder != null) {
                mediaRecorder?.stop()
                mediaRecorder?.reset()
                mediaRecorder?.release()
                mediaRecorder = null
                isRecordingActive = false
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e("MicFallbackEngine", "Error stopping mic fallback recording: ${e.message}", e)
            mediaRecorder?.release()
            mediaRecorder = null
            isRecordingActive = false
            false
        }
    }

    override fun isRecording(): Boolean = isRecordingActive
}

object RecordingEngineFactory {
    fun createEngine(context: Context, mode: RecordingMode): RecordingEngine {
        return when (mode) {
            RecordingMode.FULL -> FullRecordingEngine(context)
            RecordingMode.LEGACY -> LegacyRecordingEngine(context)
            RecordingMode.MIC_ONLY_FALLBACK -> MicFallbackRecordingEngine(context)
        }
    }
}
