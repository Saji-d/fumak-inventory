package com.fumak.scanner.data.analytics

import java.util.Calendar

enum class AnalyticsPeriod {
    TODAY,
    CURRENT_MONTH,
    LAST_3_MONTHS,
    LAST_6_MONTHS,
    CURRENT_YEAR,
    CUSTOM,
}

/** Chart range presets, independent of the [AnalyticsPeriod] summary tiles use. */
enum class ChartRange(val months: Int) {
    THREE_MONTHS(3),
    SIX_MONTHS(6),
    ONE_YEAR(12),
}

/**
 * Maps a period selection to a concrete `[startMillis, endMillis]` range for the analytics
 * queries. Uses [Calendar] rather than `java.time` — this app's `minSdk` is 24, and `java.time`
 * would require core-library desugaring for a feature `Calendar` already covers with no new deps.
 */
fun periodRange(
    period: AnalyticsPeriod,
    customStartMillis: Long? = null,
    customEndMillis: Long? = null,
    now: Long = System.currentTimeMillis(),
): Pair<Long, Long> {
    if (period == AnalyticsPeriod.CUSTOM) {
        require(customStartMillis != null && customEndMillis != null) {
            "CUSTOM period requires both customStartMillis and customEndMillis"
        }
        return customStartMillis to customEndMillis
    }

    val end = now
    val start = Calendar.getInstance().apply {
        timeInMillis = now
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
        when (period) {
            AnalyticsPeriod.TODAY -> Unit
            AnalyticsPeriod.CURRENT_MONTH -> set(Calendar.DAY_OF_MONTH, 1)
            AnalyticsPeriod.LAST_3_MONTHS -> add(Calendar.MONTH, -3)
            AnalyticsPeriod.LAST_6_MONTHS -> add(Calendar.MONTH, -6)
            AnalyticsPeriod.CURRENT_YEAR -> set(Calendar.DAY_OF_YEAR, 1)
            AnalyticsPeriod.CUSTOM -> Unit
        }
    }.timeInMillis

    return start to end
}

/** Maps a [ChartRange] to a `[startMillis, endMillis]` range ending now. */
fun chartRangeMillis(range: ChartRange, now: Long = System.currentTimeMillis()): Pair<Long, Long> {
    val start = Calendar.getInstance().apply {
        timeInMillis = now
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
        add(Calendar.MONTH, -range.months)
    }.timeInMillis
    return start to now
}
