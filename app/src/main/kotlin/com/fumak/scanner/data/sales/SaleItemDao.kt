package com.fumak.scanner.data.sales

import androidx.room.Dao
import androidx.room.Insert

@Dao
interface SaleItemDao {
    @Insert
    suspend fun insert(saleItem: SaleItemEntity): Long
}
