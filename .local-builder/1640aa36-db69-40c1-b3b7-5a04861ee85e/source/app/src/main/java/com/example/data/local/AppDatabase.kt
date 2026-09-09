package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.example.data.model.ActivityLog
import com.example.data.model.AgentSettings
import com.example.data.model.ChatMessage
import com.example.data.model.ProjectMemory

@Database(
    entities = [
        AgentSettings::class,
        ProjectMemory::class,
        ActivityLog::class,
        ChatMessage::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun settingsDao(): SettingsDao
    abstract fun projectMemoryDao(): ProjectMemoryDao
    abstract fun activityLogDao(): ActivityLogDao
    abstract fun chatDao(): ChatDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "universal_zip2apk_agent.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
