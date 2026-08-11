package com.fumak.scanner.ui.analytics

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.fumak.scanner.data.analytics.RevenueChartPoint
import com.fumak.scanner.ui.format.formatPoisha

/**
 * Minimal hand-rolled bar chart (no charting library dependency) — a single-series revenue
 * chart with 3 fixed range presets doesn't need more than Canvas gives us directly. Bars
 * (not a line) because each point is a discrete bucketed sum, including zero-sale buckets,
 * which a line would misrepresent as a continuous trend.
 */
@Composable
fun RevenueChart(points: List<RevenueChartPoint>, modifier: Modifier = Modifier) {
    var selectedIndex by remember(points) { mutableStateOf<Int?>(null) }
    val barColor = Color(0xFF43A047)
    val gridColor = Color.White.copy(alpha = 0.08f)
    val maxAmount = (points.maxOfOrNull { it.amount } ?: 0L).coerceAtLeast(1L)

    Column(modifier = modifier) {
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .pointerInput(points) {
                    detectTapGestures { offset ->
                        if (points.isEmpty()) return@detectTapGestures
                        val barWidth = size.width / points.size
                        val index = (offset.x / barWidth).toInt().coerceIn(0, points.size - 1)
                        selectedIndex = index
                    }
                },
        ) {
            if (points.isEmpty()) return@Canvas
            val barWidth = size.width / points.size
            val gap = barWidth * 0.15f

            repeat(3) { i ->
                val y = size.height * i / 3
                drawLine(gridColor, start = Offset(0f, y), end = Offset(size.width, y), strokeWidth = 1.dp.toPx())
            }

            points.forEachIndexed { index, point ->
                val barHeight = (point.amount.toFloat() / maxAmount.toFloat()) * size.height
                val left = index * barWidth + gap / 2
                val top = size.height - barHeight
                val width = barWidth - gap
                val alpha = if (selectedIndex == null || selectedIndex == index) 1f else 0.45f
                drawRoundRect(
                    color = barColor.copy(alpha = alpha),
                    topLeft = Offset(left, top),
                    size = Size(width, barHeight.coerceAtLeast(2f)),
                    cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx()),
                )
            }
        }

        Spacer(Modifier.height(8.dp))

        val selected = selectedIndex?.let { points.getOrNull(it) }
        if (selected != null) {
            Text("${selected.label}: ${formatPoisha(selected.amount)}", fontWeight = FontWeight.SemiBold)
        } else {
            Text("Tap a bar for details", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
        }

        Spacer(Modifier.height(4.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            val labelStep = (points.size / 4).coerceAtLeast(1)
            points.forEachIndexed { index, point ->
                if (index % labelStep == 0 || index == points.size - 1) {
                    Text(point.label, style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}
