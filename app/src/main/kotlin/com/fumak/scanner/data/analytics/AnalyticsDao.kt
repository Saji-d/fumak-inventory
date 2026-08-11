package com.fumak.scanner.data.analytics

import androidx.room.Dao
import androidx.room.Query

data class RevenueSummary(
    val totalRevenue: Long,
    val totalItemsSold: Int,
    val totalBuyingCost: Long,
    val totalDiscount: Long,
    val totalAmountPaid: Long,
    val totalAmountDue: Long,
)

/** One raw sale-item line, used to bucket revenue into chart points client-side. */
data class RevenuePointRow(
    val timestamp: Long,
    val amount: Long,
)

@Dao
interface AnalyticsDao {
    @Query(
        """
        SELECT
          COALESCE(SUM(si.sellingPriceEachPoisha * si.quantity - si.discountPoisha), 0) AS totalRevenue,
          COALESCE(SUM(si.quantity), 0) AS totalItemsSold,
          COALESCE(SUM(si.buyingCostEachPoisha * si.quantity), 0) AS totalBuyingCost,
          COALESCE(SUM(si.discountPoisha), 0) AS totalDiscount,
          COALESCE((SELECT SUM(amountPaid) FROM sales WHERE timestamp BETWEEN :startMillis AND :endMillis), 0) AS totalAmountPaid,
          COALESCE((SELECT SUM(amountDue) FROM sales WHERE timestamp BETWEEN :startMillis AND :endMillis), 0) AS totalAmountDue
        FROM sale_items si
        JOIN sales s ON s.id = si.saleId
        WHERE s.timestamp BETWEEN :startMillis AND :endMillis
        """
    )
    suspend fun getRevenueSummary(startMillis: Long, endMillis: Long): RevenueSummary

    @Query(
        """
        SELECT s.timestamp AS timestamp, (si.sellingPriceEachPoisha * si.quantity - si.discountPoisha) AS amount
        FROM sale_items si
        JOIN sales s ON s.id = si.saleId
        WHERE s.timestamp BETWEEN :startMillis AND :endMillis
        ORDER BY s.timestamp ASC
        """
    )
    suspend fun getRevenuePoints(startMillis: Long, endMillis: Long): List<RevenuePointRow>
}
