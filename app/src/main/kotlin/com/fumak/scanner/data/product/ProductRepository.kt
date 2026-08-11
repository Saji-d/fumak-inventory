package com.fumak.scanner.data.product

import com.fumak.scanner.data.FumakDatabase
import com.fumak.scanner.scanner.BarcodeFormat
import kotlinx.coroutines.flow.Flow

class ProductRepository(private val db: FumakDatabase) {

    suspend fun findByBarcode(barcodeValue: String): ProductEntity? =
        db.productDao().findByBarcode(barcodeValue)

    suspend fun getById(id: Long): ProductEntity? = db.productDao().getById(id)

    fun observeById(id: Long): Flow<ProductEntity?> = db.productDao().observeById(id)

    fun observeAll(): Flow<List<ProductEntity>> = db.productDao().observeAll()

    suspend fun register(
        barcodeValue: String,
        barcodeFormat: BarcodeFormat,
        name: String,
        category: String,
        color: String?,
        variant: String?,
        buyingPricePoisha: Long,
        sellingPricePoisha: Long,
        initialStock: Int,
    ): Long {
        val now = System.currentTimeMillis()
        return db.productDao().insert(
            ProductEntity(
                barcodeValue = barcodeValue,
                barcodeFormat = barcodeFormat,
                name = name,
                category = category,
                color = color,
                variant = variant,
                buyingPricePoisha = buyingPricePoisha,
                sellingPricePoisha = sellingPricePoisha,
                currentStock = initialStock,
                createdAt = now,
                updatedAt = now,
            )
        )
    }
}
