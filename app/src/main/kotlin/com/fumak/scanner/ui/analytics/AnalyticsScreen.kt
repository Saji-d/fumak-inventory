@file:OptIn(ExperimentalMaterial3Api::class, androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

package com.fumak.scanner.ui.analytics

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.fumak.scanner.data.analytics.AnalyticsPeriod
import com.fumak.scanner.data.analytics.AnalyticsRepository
import com.fumak.scanner.data.analytics.ChartRange
import com.fumak.scanner.ui.format.formatPoisha
import java.text.SimpleDateFormat
import java.util.Locale

@Composable
fun AnalyticsScreen(
    analyticsRepository: AnalyticsRepository,
    onBack: () -> Unit,
) {
    val viewModel: AnalyticsViewModel = viewModel(factory = AnalyticsViewModel.factory(analyticsRepository))
    val period by viewModel.period.collectAsState()
    val report by viewModel.report.collectAsState()
    val chartRange by viewModel.chartRange.collectAsState()
    val chartPoints by viewModel.chartPoints.collectAsState()

    var showCustomRange by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Revenue Analytics") },
                navigationIcon = { IconButton(onClick = onBack) { Text("←", fontSize = 20.sp) } },
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
        ) {
            Text("Period", style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(8.dp))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PeriodOption.entries.forEach { option ->
                    FilterChip(
                        selected = period == option.period,
                        onClick = {
                            if (option == PeriodOption.CUSTOM) {
                                showCustomRange = true
                            } else {
                                showCustomRange = false
                                viewModel.selectPeriod(option.period)
                            }
                        },
                        label = { Text(option.label) },
                    )
                }
            }

            if (showCustomRange) {
                Spacer(Modifier.height(8.dp))
                CustomRangePicker(onApply = { start, end -> viewModel.selectCustomRange(start, end) })
            }

            Spacer(Modifier.height(16.dp))
            SummaryGrid(report = report)

            Spacer(Modifier.height(24.dp))
            Text("Revenue Over Time", style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ChartRangeOption.entries.forEach { option ->
                    FilterChip(
                        selected = chartRange == option.range,
                        onClick = { viewModel.selectChartRange(option.range) },
                        label = { Text(option.label) },
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
            RevenueChart(points = chartPoints, modifier = Modifier.fillMaxWidth())
        }
    }
}

private enum class PeriodOption(val period: AnalyticsPeriod, val label: String) {
    TODAY(AnalyticsPeriod.TODAY, "Today"),
    CURRENT_MONTH(AnalyticsPeriod.CURRENT_MONTH, "This Month"),
    LAST_3_MONTHS(AnalyticsPeriod.LAST_3_MONTHS, "Last 3 Months"),
    LAST_6_MONTHS(AnalyticsPeriod.LAST_6_MONTHS, "Last 6 Months"),
    CURRENT_YEAR(AnalyticsPeriod.CURRENT_YEAR, "This Year"),
    CUSTOM(AnalyticsPeriod.CUSTOM, "Custom"),
}

private enum class ChartRangeOption(val range: ChartRange, val label: String) {
    THREE_MONTHS(ChartRange.THREE_MONTHS, "3M"),
    SIX_MONTHS(ChartRange.SIX_MONTHS, "6M"),
    ONE_YEAR(ChartRange.ONE_YEAR, "1Y"),
}

@Composable
private fun SummaryGrid(report: com.fumak.scanner.data.analytics.PeriodReport?) {
    val tiles = listOf(
        "Total Revenue" to formatPoisha(report?.totalRevenue ?: 0),
        "Items Sold" to (report?.totalItemsSold ?: 0).toString(),
        "Buying Cost" to formatPoisha(report?.totalBuyingCost ?: 0),
        "Gross Profit" to formatPoisha(report?.grossProfit ?: 0),
        "Discounts" to formatPoisha(report?.totalDiscount ?: 0),
        "Amount Paid" to formatPoisha(report?.totalPaid ?: 0),
        "Amount Due" to formatPoisha(report?.totalDue ?: 0),
    )
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        tiles.forEach { (label, value) ->
            Card(modifier = Modifier.padding(bottom = 8.dp)) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(label, style = MaterialTheme.typography.labelMedium)
                    Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun CustomRangePicker(onApply: (startMillis: Long, endMillis: Long) -> Unit) {
    var startText by remember { mutableStateOf("") }
    var endText by remember { mutableStateOf("") }
    val format = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()) }

    Column {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(value = startText, onValueChange = { startText = it }, label = { Text("Start (yyyy-MM-dd)") }, modifier = Modifier.weight(1f))
            OutlinedTextField(value = endText, onValueChange = { endText = it }, label = { Text("End (yyyy-MM-dd)") }, modifier = Modifier.weight(1f))
        }
        Spacer(Modifier.height(8.dp))
        Button(onClick = {
            val start = runCatching { format.parse(startText)?.time }.getOrNull()
            val end = runCatching { format.parse(endText)?.time }.getOrNull()
            if (start != null && end != null) onApply(start, end + 24 * 60 * 60 * 1000 - 1)
        }) {
            Text("Apply Range")
        }
    }
}
