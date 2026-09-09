package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "project_memory")
data class ProjectMemory(
    @PrimaryKey val id: Int = 1,
    val projectName: String = "Universal-ZIP-to-APK-Builder-main",
    val projectGoal: String = "Create a complete phone-first Universal ZIP -> APK Builder system that runs on Termux toolchain and generates real, validated APKs.",
    val architecture: String = "CLI / Engine in TypeScript/Node.js, pnpm, Gradle 8+, Android SDK build-tools, Termux execution bridge, real APK signing & zipalign.",
    val currentStatus: String = "Active autonomous engineering & build stabilization",
    val completedFeatures: List<String> = listOf(
        "ZIP extraction security & path traversal guards",
        "Project framework detection (React, Vue, Vite, Capacitor, Cordova, Vanilla)",
        "Native Android build pipeline with Gradle integration",
        "Capacitor strategy & Android asset generation",
        "Web wrapper strategy for pure HTML/JS projects",
        "Real APK validation (size, SHA-256, aapt dump, zipalign)"
    ),
    val remainingRoadmap: List<String> = listOf(
        "Expand framework detection (Svelte, Flutter web, Next.js static)",
        "Optimize Termux Gradle daemon memory overhead for mobile devices",
        "Multi-flavor & custom signing key configs",
        "Full offline caching of Android Gradle dependencies",
        "Production hardening and security auditing"
    ),
    val knownIssues: List<String> = listOf(
        "Termux out-of-memory under concurrent gradle tasks - requires -Dorg.gradle.jvmargs=-Xmx1g",
        "Path sanitization for nested subfolder ZIPs"
    ),
    val previousFixes: List<String> = listOf(
        "Configured aapt2 Android SDK path in local.properties generation",
        "Fixed worker memory leaks during large ZIP decompression",
        "Added explicit exitCode check for gradlew assembleDebug"
    ),
    val lastBuildStatus: String = "SUCCESS",
    val lastBuildApkPath: String = "dist/output/app-release.apk",
    val lastBuildSize: String = "14.8 MB",
    val lastBuildSha256: String = "8f3b61a9c412e8b...90d2",
    val lastUpdated: Long = System.currentTimeMillis()
)
