package com.callrecorder.ry.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.callrecorder.ry.data.db.dao.ExcludedNumberDao
import com.callrecorder.ry.data.db.dao.RecordingDao
import com.callrecorder.ry.data.db.entity.ExcludedNumberEntity
import com.callrecorder.ry.data.db.entity.RecordingEntity

@Database(
    entities = [RecordingEntity::class, ExcludedNumberEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun recordingDao(): RecordingDao
    abstract fun excludedNumberDao(): ExcludedNumberDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "ry_call_recorder.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
