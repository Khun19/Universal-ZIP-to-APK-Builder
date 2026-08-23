package com.callrecorder.ry.util

import android.content.Context
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object FileUtils {

    fun getRecordingsDirectory(context: Context): File {
        val externalDir = context.getExternalFilesDir("Recordings")
        val dir = externalDir ?: File(context.filesDir, "recordings")
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return dir
    }

    fun generateRecordingFile(context: Context, phoneNumber: String): File {
        val dir = getRecordingsDirectory(context)
        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val cleanNumber = phoneNumber.replace(Regex("[^0-9+]"), "")
        val fileName = "REC_${timestamp}_${if (cleanNumber.isNotEmpty()) cleanNumber else "UNKNOWN"}.m4a"
        return File(dir, fileName)
    }

    fun formatDuration(durationMillis: Long): String {
        val totalSeconds = (durationMillis / 1000).toInt()
        val minutes = totalSeconds / 60
        val seconds = totalSeconds % 60
        return String.format(Locale.getDefault(), "%02d:%02d", minutes, seconds)
    }

    fun formatDurationSeconds(durationSeconds: Long): String {
        val minutes = durationSeconds / 60
        val seconds = durationSeconds % 60
        return String.format(Locale.getDefault(), "%02d:%02d", minutes, seconds)
    }

    fun formatFileSize(bytes: Long): String {
        if (bytes <= 0) return "0 B"
        val units = arrayOf("B", "KB", "MB", "GB")
        val digitGroups = (Math.log10(bytes.toDouble()) / Math.log10(1024.0)).toInt()
        return String.format(
            Locale.getDefault(),
            "%.1f %s",
            bytes / Math.pow(1024.0, digitGroups.toDouble()),
            units[digitGroups]
        )
    }

    fun formatDateTime(timestamp: Long): String {
        val sdf = SimpleDateFormat("MMM dd, yyyy • hh:mm a", Locale.getDefault())
        return sdf.format(Date(timestamp))
    }

    fun formatTimeOnly(timestamp: Long): String {
        val sdf = SimpleDateFormat("hh:mm a", Locale.getDefault())
        return sdf.format(Date(timestamp))
    }

    fun createValidSampleAudioFile(targetFile: File, durationSeconds: Int = 10) {
        try {
            val sampleRate = 16000
            val numChannels = 1
            val bitsPerSample = 16
            val totalSamples = sampleRate * durationSeconds
            val dataSize = totalSamples * numChannels * (bitsPerSample / 8)
            val chunkSize = 36 + dataSize
            val byteRate = sampleRate * numChannels * (bitsPerSample / 8)
            val blockAlign = numChannels * (bitsPerSample / 8)

            java.io.FileOutputStream(targetFile).use { fos ->
                val buffer = java.nio.ByteBuffer.allocate(44).order(java.nio.ByteOrder.LITTLE_ENDIAN)
                buffer.put("RIFF".toByteArray())
                buffer.putInt(chunkSize)
                buffer.put("WAVE".toByteArray())
                buffer.put("fmt ".toByteArray())
                buffer.putInt(16) // Subchunk1Size for PCM
                buffer.putShort(1.toShort()) // AudioFormat 1 = PCM
                buffer.putShort(numChannels.toShort())
                buffer.putInt(sampleRate)
                buffer.putInt(byteRate)
                buffer.putShort(blockAlign.toShort())
                buffer.putShort(bitsPerSample.toShort())
                buffer.put("data".toByteArray())
                buffer.putInt(dataSize)
                fos.write(buffer.array())

                // Write gentle sinusoidal audio wave (440Hz standard concert A tone)
                val pcmBuffer = java.nio.ByteBuffer.allocate(sampleRate * 2).order(java.nio.ByteOrder.LITTLE_ENDIAN)
                for (sec in 0 until durationSeconds) {
                    pcmBuffer.clear()
                    for (i in 0 until sampleRate) {
                        val angle = 2.0 * Math.PI * 440.0 * i / sampleRate
                        val sample = (Math.sin(angle) * 3000.0).toInt().toShort()
                        pcmBuffer.putShort(sample)
                    }
                    fos.write(pcmBuffer.array())
                }
            }
        } catch (e: Exception) {
            // Ignore file write errors
        }
    }
}

