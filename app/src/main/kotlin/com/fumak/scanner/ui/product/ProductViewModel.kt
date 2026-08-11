package com.fumak.scanner.ui.product

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.fumak.scanner.data.inventory.InventoryRepository
import com.fumak.scanner.data.inventory.InventoryTransactionEntity
import com.fumak.scanner.data.product.ProductEntity
import com.fumak.scanner.data.product.ProductRepository
import com.fumak.scanner.scanner.BarcodeFormat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/** Backs both [ProductDetailScreen] (when [productId] is supplied) and [RegisterProductScreen]
 * (which only ever calls [registerProduct], independent of [productId]). */
class ProductViewModel(
    private val productRepository: ProductRepository,
    private val inventoryRepository: InventoryRepository,
    productId: Long? = null,
) : ViewModel() {

    val product: StateFlow<ProductEntity?> = productId
        ?.let { productRepository.observeById(it) }
        ?.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)
        ?: MutableStateFlow(null).asStateFlow()

    val history: StateFlow<List<InventoryTransactionEntity>> = productId
        ?.let { inventoryRepository.observeHistoryForProduct(it) }
        ?.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
        ?: MutableStateFlow(emptyList<InventoryTransactionEntity>()).asStateFlow()

    private val _actionError = MutableStateFlow<String?>(null)
    val actionError: StateFlow<String?> = _actionError.asStateFlow()

    fun addStock(productId: Long, quantity: Int) = runAction {
        inventoryRepository.addStock(productId, quantity)
    }

    fun removeStock(productId: Long, quantity: Int) = runAction {
        inventoryRepository.removeStock(productId, quantity)
    }

    fun adjustStock(productId: Long, newStock: Int, reason: String?) = runAction {
        inventoryRepository.setAbsoluteStock(productId, newStock, reason)
    }

    suspend fun registerProduct(
        barcode: String,
        format: BarcodeFormat,
        name: String,
        category: String,
        color: String?,
        variant: String?,
        buyingPricePoisha: Long,
        sellingPricePoisha: Long,
        initialStock: Int,
    ): Long = productRepository.register(
        barcodeValue = barcode,
        barcodeFormat = format,
        name = name,
        category = category,
        color = color,
        variant = variant,
        buyingPricePoisha = buyingPricePoisha,
        sellingPricePoisha = sellingPricePoisha,
        initialStock = initialStock,
    )

    private fun runAction(block: suspend () -> Unit) {
        viewModelScope.launch {
            runCatching { block() }.onFailure { _actionError.value = it.message }
        }
    }

    companion object {
        fun factory(
            productRepository: ProductRepository,
            inventoryRepository: InventoryRepository,
            productId: Long? = null,
        ) = viewModelFactory {
            initializer { ProductViewModel(productRepository, inventoryRepository, productId) }
        }
    }
}
