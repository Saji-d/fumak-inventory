package com.fumak.scanner.data.analytics

import com.fumak.scanner.data.FumakDatabase
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

data class PeriodReport(
    val totalRevenue: Long,
    val totalItemsSold: Int,
    val totalBuyingCost: Long,
    val grossProfit: Long,
    val totalDiscount: Long,
    val totalPaid: Long,
    val totalDue: Long,
)

data class RevenueChartPoint(
    val label: String,
    val bucketStartMillis: Long,
    val amount: Long,
)

class AnalyticsRepository(private val db: FumakDatabase) {

    suspend fun getSummary(
        period: AnalyticsPeriod,
        customStartMillis: Long? = null,
        customEndMillis: Long? = null,
    ): PeriodReport {
        val (start, end) = periodRange(period, customStartMillis, customEndMillis)
        val summary = db.analyticsDao().getRevenueSummary(start, end)
        return PeriodReport(
            totalRevenue = summary.totalRevenue,
            totalItemsSold = summary.totalItemsSold,
            totalBuyingCost = summary.totalBuyingCost,
            grossProfit = summary.totalRevenue - summary.totalBuyingCost,
            totalDiscount = summary.totalDiscount,
            totalPaid = summary.totalAmountPaid,
            totalDue = summary.totalAmountDue,
        )
    }

    /**
     * Revenue bucketed for charting: [ChartRange.ONE_YEAR] buckets by calendar month (12 bars),
     * shorter ranges bucket by week (~13/~26 bars) — both computed client-side from one raw
     * query so buckets with zero sales still appear as zero-height bars rather than being
     * silently skipped.
     */
    suspend fun getChartPoints(range: ChartRange): List<RevenueChartPoint> {
        val now = System.currentTimeMillis()
        val (start, end) = chartRangeMillis(range, now)
        val rawPoints = db.analyticsDao().getRevenuePoints(start, end)

        val buckets = if (range == ChartRange.ONE_YEAR) monthBuckets(range.months, now) else weekBuckets(range.months, now)
        val labelFormat = SimpleDateFormat(if (range == ChartRange.ONE_YEAR) "MMM" else "MMM d", Locale.getDefault())

        return buckets.map { (bucketStart, bucketEnd) ->
            val amount = rawPoints
                .filter { it.timestamp >= bucketStart && it.timestamp < bucketEnd }
                .sumOf { it.amount }
            RevenueChartPoint(
                label = labelFormat.format(bucketStart),
                bucketStartMillis = bucketStart,
                amount = amount,
            )
        }
    }

    private fun monthBuckets(monthCount: Int, now: Long): List<Pair<Long, Long>> {
        val cursor = Calendar.getInstance().apply {
            timeInMillis = now
            set(Calendar.DAY_OF_MONTH, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            add(Calendar.MONTH, -(monthCount - 1))
        }
        return (0 until monthCount).map {
            val start = cursor.timeInMillis
            cursor.add(Calendar.MONTH, 1)
            start to cursor.timeInMillis
        }
    }

    private fun weekBuckets(monthsBack: Int, now: Long): List<Pair<Long, Long>> {
        val end = now
        val start = Calendar.getInstance().apply {
            timeInMillis = now
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            add(Calendar.MONTH, -monthsBack)
        }.timeInMillis

        val weekMillis = 7L * 24 * 60 * 60 * 1000
        val buckets = mutableListOf<Pair<Long, Long>>()
        var cursor = start
        while (cursor < end) {
            val bucketEnd = minOf(cursor + weekMillis, end)
            buckets.add(cursor to bucketEnd)
            cursor = bucketEnd
        }
        return buckets
    }
}
