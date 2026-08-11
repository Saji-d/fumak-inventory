package com.fumak.scanner.ui.nav

import android.net.Uri
import com.fumak.scanner.scanner.BarcodeFormat

/** Plain string routes (no kotlinx-serialization dependency needed for 4 simple screens). */
object Routes {
    const val SCANNER = "scanner"
    const val PRODUCT_DETAIL_PATTERN = "productDetail/{productId}"
    const val REGISTER_PRODUCT_PATTERN = "registerProduct/{barcode}/{format}"
    const val RECORD_SALE_PATTERN = "recordSale/{productId}"
    const val ANALYTICS = "analytics"

    fun productDetail(productId: Long) = "productDetail/$productId"

    fun registerProduct(barcode: String, format: BarcodeFormat) =
        "registerProduct/${Uri.encode(barcode)}/${format.name}"

    fun recordSale(productId: Long) = "recordSale/$productId"
}
