package com.fumak.scanner.ui.scanner

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.fumak.scanner.data.product.ProductEntity
import com.fumak.scanner.data.product.ProductRepository
import com.fumak.scanner.scanner.BarcodeFormat
import com.fumak.scanner.scanner.BarcodeScanResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface ProductLookupState {
    data object Idle : ProductLookupState
    data class Found(val product: ProductEntity) : ProductLookupState
    data class NotFound(val barcode: String, val format: BarcodeFormat) : ProductLookupState
}

/**
 * Resolves each [BarcodeScanResult] surfaced by the existing (frozen) scanner UI against the
 * product catalog. Does not touch `scanner/` — the scan pipeline is unaware this exists.
 */
class ScannerViewModel(private val productRepository: ProductRepository) : ViewModel() {
    private val _lookupState = MutableStateFlow<ProductLookupState>(ProductLookupState.Idle)
    val lookupState: StateFlow<ProductLookupState> = _lookupState.asStateFlow()

    fun onBarcodeScanned(result: BarcodeScanResult) {
        viewModelScope.launch {
            val product = productRepository.findByBarcode(result.value)
            _lookupState.value = if (product != null) {
                ProductLookupState.Found(product)
            } else {
                ProductLookupState.NotFound(result.value, result.format)
            }
        }
    }

    companion object {
        fun factory(productRepository: ProductRepository) = viewModelFactory {
            initializer { ScannerViewModel(productRepository) }
        }
    }
}
