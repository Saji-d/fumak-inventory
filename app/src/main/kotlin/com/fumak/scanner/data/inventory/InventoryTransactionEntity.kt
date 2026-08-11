package com.fumak.scanner.data.inventory

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.fumak.scanner.data.product.ProductEntity
import com.fumak.scanner.data.sales.SaleEntity

enum class InventoryTransactionType { ADD, REMOVE, ADJUST, SALE }

/**
 * Full audit log for every stock-affecting event, including sale-driven decrements.
 * [resultingStock] snapshots the stock level immediately after this event so history
 * can be read directly without replaying every prior delta.
 */
@Entity(
    tableName = "inventory_transactions",
    foreignKeys = [
        ForeignKey(
            entity = ProductEntity::class,
            parentColumns = ["id"],
            childColumns = ["productId"],
            onDelete = ForeignKey.CASCADE,
        ),
        ForeignKey(
            entity = SaleEntity::class,
            parentColumns = ["id"],
            childColumns = ["saleId"],
            onDelete = ForeignKey.SET_NULL,
        ),
    ],
    indices = [Index("productId"), Index("saleId"), Index("timestamp")],
)
data class InventoryTransactionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val productId: Long,
    val type: InventoryTransactionType,
    val quantityDelta: Int,
    val resultingStock: Int,
    val reason: String?,
    val saleId: Long?,
    val timestamp: Long,
)
