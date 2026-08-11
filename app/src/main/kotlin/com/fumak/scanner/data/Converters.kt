package com.fumak.scanner.data

import androidx.room.TypeConverter
import com.fumak.scanner.data.inventory.InventoryTransactionType
import com.fumak.scanner.data.sales.PaymentType
import com.fumak.scanner.scanner.BarcodeFormat

/** Enum <-> String conversions for Room. Written explicitly rather than relying on
 * Room's version-dependent native enum support, so behavior is guaranteed stable. */
class Converters {
    @TypeConverter
    fun barcodeFormatToString(value: BarcodeFormat): String = value.name

    @TypeConverter
    fun stringToBarcodeFormat(value: String): BarcodeFormat = BarcodeFormat.valueOf(value)

    @TypeConverter
    fun inventoryTransactionTypeToString(value: InventoryTransactionType): String = value.name

    @TypeConverter
    fun stringToInventoryTransactionType(value: String): InventoryTransactionType =
        InventoryTransactionType.valueOf(value)

    @TypeConverter
    fun paymentTypeToString(value: PaymentType): String = value.name

    @TypeConverter
    fun stringToPaymentType(value: String): PaymentType = PaymentType.valueOf(value)
}
