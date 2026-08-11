package com.fumak.scanner.data.sales

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface SaleDao {
    @Insert
    suspend fun insert(sale: SaleEntity): Long

    @Query("SELECT * FROM sales ORDER BY timestamp DESC")
    fun observeAll(): Flow<List<SaleEntity>>
}
