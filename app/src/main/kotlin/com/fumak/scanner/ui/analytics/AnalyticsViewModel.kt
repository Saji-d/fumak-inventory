package com.fumak.scanner.ui.analytics

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.fumak.scanner.data.analytics.AnalyticsPeriod
import com.fumak.scanner.data.analytics.AnalyticsRepository
import com.fumak.scanner.data.analytics.ChartRange
import com.fumak.scanner.data.analytics.PeriodReport
import com.fumak.scanner.data.analytics.RevenueChartPoint
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class AnalyticsViewModel(private val analyticsRepository: AnalyticsRepository) : ViewModel() {

    private val _period = MutableStateFlow(AnalyticsPeriod.TODAY)
    val period: StateFlow<AnalyticsPeriod> = _period

    private var customRange: Pair<Long, Long>? = null

    private val _report = MutableStateFlow<PeriodReport?>(null)
    val report: StateFlow<PeriodReport?> = _report

    private val _chartRange = MutableStateFlow(ChartRange.THREE_MONTHS)
    val chartRange: StateFlow<ChartRange> = _chartRange

    private val _chartPoints = MutableStateFlow<List<RevenueChartPoint>>(emptyList())
    val chartPoints: StateFlow<List<RevenueChartPoint>> = _chartPoints

    init {
        refreshReport()
        refreshChart()
    }

    fun selectPeriod(period: AnalyticsPeriod) {
        _period.value = period
        if (period != AnalyticsPeriod.CUSTOM) refreshReport()
    }

    fun selectCustomRange(startMillis: Long, endMillis: Long) {
        customRange = startMillis to endMillis
        _period.value = AnalyticsPeriod.CUSTOM
        refreshReport()
    }

    fun selectChartRange(range: ChartRange) {
        _chartRange.value = range
        refreshChart()
    }

    private fun refreshReport() {
        viewModelScope.launch {
            _report.value = analyticsRepository.getSummary(
                period = _period.value,
                customStartMillis = customRange?.first,
                customEndMillis = customRange?.second,
            )
        }
    }

    private fun refreshChart() {
        viewModelScope.launch {
            _chartPoints.value = analyticsRepository.getChartPoints(_chartRange.value)
        }
    }

    companion object {
        fun factory(analyticsRepository: AnalyticsRepository) = viewModelFactory {
            initializer { AnalyticsViewModel(analyticsRepository) }
        }
    }
}
