package com.fumak.scanner.data.inventory

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface InventoryTransactionDao {
    @Insert
    suspend fun insert(transaction: InventoryTransactionEntity): Long

    @Query("SELECT * FROM inventory_transactions WHERE productId = :productId ORDER BY timestamp DESC")
    fun observeForProduct(productId: Long): Flow<List<InventoryTransactionEntity>>
}
