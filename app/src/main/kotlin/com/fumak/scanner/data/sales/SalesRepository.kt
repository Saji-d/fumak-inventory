package com.fumak.scanner.data.sales

import androidx.room.withTransaction
import com.fumak.scanner.data.FumakDatabase
import com.fumak.scanner.data.inventory.InventoryRepository
import kotlinx.coroutines.flow.Flow
import kotlin.math.max

class SalesRepository(
    private val db: FumakDatabase,
    private val inventoryRepository: InventoryRepository,
) {

    fun observeAll(): Flow<List<SaleEntity>> = db.saleDao().observeAll()

    /**
     * Records a single-product sale: inserts the sale header + line item, and decrements
     * inventory (logged as a [com.fumak.scanner.data.inventory.InventoryTransactionType.SALE]
     * entry), all atomically — a completed sale must never leave stock and sales history out
     * of sync.
     */
    suspend fun recordSingleItemSale(
        productId: Long,
        quantity: Int,
        sellingPriceEachPoisha: Long,
        buyingCostEachPoisha: Long,
        discountPoisha: Long,
        paymentType: PaymentType,
        amountPaid: Long,
    ): SaleEntity {
        require(quantity > 0) { "Quantity must be positive" }
        require(discountPoisha >= 0) { "Discount cannot be negative" }
        require(amountPaid >= 0) { "Amount paid cannot be negative" }

        val totalAmount = (sellingPriceEachPoisha * quantity) - discountPoisha
        val amountDue = max(totalAmount - amountPaid, 0)
        val changeAmount = max(amountPaid - totalAmount, 0)

        return db.withTransaction {
            val sale = SaleEntity(
                timestamp = System.currentTimeMillis(),
                paymentType = paymentType,
                totalAmount = totalAmount,
                amountPaid = amountPaid,
                amountDue = amountDue,
                changeAmount = changeAmount,
            )
            val saleId = db.saleDao().insert(sale)

            db.saleItemDao().insert(
                SaleItemEntity(
                    saleId = saleId,
                    productId = productId,
                    quantity = quantity,
                    sellingPriceEachPoisha = sellingPriceEachPoisha,
                    buyingCostEachPoisha = buyingCostEachPoisha,
                    discountPoisha = discountPoisha,
                )
            )

            inventoryRepository.applyDeltaWithinTransaction(productId, -quantity, saleId)

            sale.copy(id = saleId)
        }
    }
}
