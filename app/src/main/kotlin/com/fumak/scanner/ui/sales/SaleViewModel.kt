package com.fumak.scanner.ui.sales

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.fumak.scanner.data.product.ProductEntity
import com.fumak.scanner.data.product.ProductRepository
import com.fumak.scanner.data.sales.PaymentType
import com.fumak.scanner.data.sales.SalesRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SaleViewModel(
    private val productRepository: ProductRepository,
    private val salesRepository: SalesRepository,
    productId: Long,
) : ViewModel() {

    val product: StateFlow<ProductEntity?> = productRepository.observeById(productId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    private val _saving = MutableStateFlow(false)
    val saving: StateFlow<Boolean> = _saving

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun recordSale(
        productId: Long,
        quantity: Int,
        sellingPriceEachPoisha: Long,
        buyingCostEachPoisha: Long,
        discountPoisha: Long,
        paymentType: PaymentType,
        amountPaid: Long,
        onSuccess: () -> Unit,
    ) {
        _saving.value = true
        viewModelScope.launch {
            runCatching {
                salesRepository.recordSingleItemSale(
                    productId = productId,
                    quantity = quantity,
                    sellingPriceEachPoisha = sellingPriceEachPoisha,
                    buyingCostEachPoisha = buyingCostEachPoisha,
                    discountPoisha = discountPoisha,
                    paymentType = paymentType,
                    amountPaid = amountPaid,
                )
            }.onSuccess {
                _saving.value = false
                onSuccess()
            }.onFailure {
                _saving.value = false
                _error.value = it.message ?: "Failed to record sale"
            }
        }
    }

    companion object {
        fun factory(productRepository: ProductRepository, salesRepository: SalesRepository, productId: Long) =
            viewModelFactory {
                initializer { SaleViewModel(productRepository, salesRepository, productId) }
            }
    }
}
