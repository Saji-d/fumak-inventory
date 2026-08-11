package com.fumak.scanner.data.inventory

import androidx.room.withTransaction
import com.fumak.scanner.data.FumakDatabase
import kotlinx.coroutines.flow.Flow

class InventoryRepository(private val db: FumakDatabase) {

    fun observeHistoryForProduct(productId: Long): Flow<List<InventoryTransactionEntity>> =
        db.inventoryTransactionDao().observeForProduct(productId)

    suspend fun addStock(productId: Long, quantity: Int, reason: String? = null): InventoryTransactionEntity {
        require(quantity > 0) { "Quantity to add must be positive" }
        return db.withTransaction { applyDeltaLocked(productId, InventoryTransactionType.ADD, quantity, reason) }
    }

    suspend fun removeStock(productId: Long, quantity: Int, reason: String? = null): InventoryTransactionEntity {
        require(quantity > 0) { "Quantity to remove must be positive" }
        return db.withTransaction { applyDeltaLocked(productId, InventoryTransactionType.REMOVE, -quantity, reason) }
    }

    /** "Adjust" is an absolute correction (e.g. after a physical stock count), not a delta. */
    suspend fun setAbsoluteStock(productId: Long, newStock: Int, reason: String? = null): InventoryTransactionEntity {
        require(newStock >= 0) { "Stock cannot go negative" }
        return db.withTransaction {
            val product = db.productDao().getById(productId) ?: error("Product $productId not found")
            applyDeltaLocked(productId, InventoryTransactionType.ADJUST, newStock - product.currentStock, reason)
        }
    }

    /** Used by [com.fumak.scanner.data.sales.SalesRepository] so a sale's stock decrement is
     * recorded in the same audit log, tagged with [InventoryTransactionType.SALE] and linked
     * back to the sale via [saleId]. Must be called from within the caller's own `withTransaction`. */
    internal suspend fun applyDeltaWithinTransaction(productId: Long, delta: Int, saleId: Long): InventoryTransactionEntity =
        applyDeltaLocked(productId, InventoryTransactionType.SALE, delta, reason = null, saleId = saleId)

    /** Must only be called from inside an existing `db.withTransaction { }` block. */
    private suspend fun applyDeltaLocked(
        productId: Long,
        type: InventoryTransactionType,
        delta: Int,
        reason: String?,
        saleId: Long? = null,
    ): InventoryTransactionEntity {
        val product = db.productDao().getById(productId) ?: error("Product $productId not found")
        val newStock = product.currentStock + delta
        require(newStock >= 0) { "Stock cannot go negative" }
        db.productDao().update(product.copy(currentStock = newStock, updatedAt = System.currentTimeMillis()))
        val transaction = InventoryTransactionEntity(
            productId = productId,
            type = type,
            quantityDelta = delta,
            resultingStock = newStock,
            reason = reason,
            saleId = saleId,
            timestamp = System.currentTimeMillis(),
        )
        val id = db.inventoryTransactionDao().insert(transaction)
        return transaction.copy(id = id)
    }
}
