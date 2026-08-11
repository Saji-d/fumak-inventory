package com.fumak.scanner.data.sales

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class PaymentType { CASH, CARD, MOBILE_MONEY, OTHER }

/**
 * Header row for a completed sale. Amounts are integer poisha (1/100 BDT).
 * [amountDue] and [changeAmount] are mutually exclusive and precomputed at save time —
 * exactly one is non-zero depending on whether [amountPaid] under- or over-covers [totalAmount].
 */
@Entity(tableName = "sales")
data class SaleEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val timestamp: Long,
    val paymentType: PaymentType,
    val totalAmount: Long,
    val amountPaid: Long,
    val amountDue: Long,
    val changeAmount: Long,
)
