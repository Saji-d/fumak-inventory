package com.fumak.scanner.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.fumak.scanner.data.analytics.AnalyticsDao
import com.fumak.scanner.data.inventory.InventoryTransactionDao
import com.fumak.scanner.data.inventory.InventoryTransactionEntity
import com.fumak.scanner.data.product.ProductDao
import com.fumak.scanner.data.product.ProductEntity
import com.fumak.scanner.data.sales.SaleDao
import com.fumak.scanner.data.sales.SaleEntity
import com.fumak.scanner.data.sales.SaleItemDao
import com.fumak.scanner.data.sales.SaleItemEntity

@Database(
    entities = [
        ProductEntity::class,
        InventoryTransactionEntity::class,
        SaleEntity::class,
        SaleItemEntity::class,
    ],
    version = 1,
    exportSchema = true,
)
@TypeConverters(Converters::class)
abstract class FumakDatabase : RoomDatabase() {
    abstract fun productDao(): ProductDao
    abstract fun inventoryTransactionDao(): InventoryTransactionDao
    abstract fun saleDao(): SaleDao
    abstract fun saleItemDao(): SaleItemDao
    abstract fun analyticsDao(): AnalyticsDao

    companion object {
        @Volatile private var instance: FumakDatabase? = null

        fun getInstance(context: Context): FumakDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    FumakDatabase::class.java,
                    "fumak.db",
                ).build().also { instance = it }
            }
    }
}
