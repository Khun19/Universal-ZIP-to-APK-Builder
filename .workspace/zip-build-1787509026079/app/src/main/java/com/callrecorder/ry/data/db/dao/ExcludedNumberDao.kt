package com.callrecorder.ry.data.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.callrecorder.ry.data.db.entity.ExcludedNumberEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ExcludedNumberDao {

    @Query("SELECT * FROM excluded_numbers ORDER BY addedAt DESC")
    fun getAllExcludedNumbers(): Flow<List<ExcludedNumberEntity>>

    @Query("SELECT * FROM excluded_numbers WHERE phoneNumber = :phoneNumber LIMIT 1")
    suspend fun getExcludedNumber(phoneNumber: String): ExcludedNumberEntity?

    @Query("SELECT EXISTS(SELECT 1 FROM excluded_numbers WHERE phoneNumber = :phoneNumber)")
    suspend fun isNumberExcluded(phoneNumber: String): Boolean

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExcludedNumber(entity: ExcludedNumberEntity)

    @Query("DELETE FROM excluded_numbers WHERE phoneNumber = :phoneNumber")
    suspend fun deleteExcludedNumber(phoneNumber: String)
}
