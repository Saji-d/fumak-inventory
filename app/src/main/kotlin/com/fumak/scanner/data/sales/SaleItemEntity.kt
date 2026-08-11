package com.fumak.scanner.data.sales

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.fumak.scanner.data.product.ProductEntity

/**
 * A single product line within a [SaleEntity]. V1 only ever records one line per sale,
 * but the split from the header exists so multi-item sales can be added later without a
 * schema migration. Prices are snapshotted at sale time (not looked up live from
 * [ProductEntity]) so historical gross-profit reports stay correct after a product's
 * price later changes.
 */
@Entity(
    tableName = "sale_items",
    foreignKeys = [
        ForeignKey(
            entity = SaleEntity::class,
            parentColumns = ["id"],
            childColumns = ["saleId"],
            onDelete = ForeignKey.CASCADE,
        ),
        ForeignKey(
            entity = ProductEntity::class,
            parentColumns = ["id"],
            childColumns = ["productId"],
            onDelete = ForeignKey.RESTRICT,
        ),
    ],
    indices = [Index("saleId"), Index("productId")],
)
data class SaleItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val saleId: Long,
    val productId: Long,
    val quantity: Int,
    val sellingPriceEachPoisha: Long,
    val buyingCostEachPoisha: Long,
    val discountPoisha: Long,
)
