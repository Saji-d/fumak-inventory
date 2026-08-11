package com.fumak.scanner.data.product

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.fumak.scanner.scanner.BarcodeFormat

/**
 * A product FUMAK sells, keyed to the physical barcode already printed on it.
 * [barcodeValue] is the raw decoded [com.fumak.scanner.scanner.BarcodeScanResult.value] —
 * kept as a String (never parsed as a number) so leading zeros in EAN/UPC codes survive.
 * Prices are stored as integer poisha (1/100 BDT) to avoid float drift when summing sales.
 */
@Entity(
    tableName = "products",
    indices = [Index(value = ["barcodeValue"], unique = true)],
)
data class ProductEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val barcodeValue: String,
    val barcodeFormat: BarcodeFormat,
    val name: String,
    val category: String,
    val color: String?,
    val variant: String?,
    val buyingPricePoisha: Long,
    val sellingPricePoisha: Long,
    val currentStock: Int,
    val createdAt: Long,
    val updatedAt: Long,
)
