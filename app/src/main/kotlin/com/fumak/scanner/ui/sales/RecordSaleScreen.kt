@file:OptIn(ExperimentalMaterial3Api::class)

package com.fumak.scanner.ui.sales

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import com.fumak.scanner.data.product.ProductRepository
import com.fumak.scanner.data.sales.PaymentType
import com.fumak.scanner.data.sales.SalesRepository
import com.fumak.scanner.ui.format.formatPoisha
import kotlin.math.max

@Composable
fun RecordSaleScreen(
    productId: Long,
    productRepository: ProductRepository,
    salesRepository: SalesRepository,
    onBack: () -> Unit,
    onSaleRecorded: () -> Unit,
) {
    val viewModel: SaleViewModel = viewModel(
        factory = SaleViewModel.factory(productRepository, salesRepository, productId),
    )
    val product by viewModel.product.collectAsState()
    val saving by viewModel.saving.collectAsState()
    val error by viewModel.error.collectAsState()

    var quantity by remember { mutableStateOf("1") }
    var sellingPrice by remember(product) { mutableStateOf(product?.sellingPricePoisha?.let { it / 100.0 }?.toString() ?: "") }
    var buyingCost by remember(product) { mutableStateOf(product?.buyingPricePoisha?.let { it / 100.0 }?.toString() ?: "") }
    var discount by remember { mutableStateOf("0") }
    var amountPaid by remember { mutableStateOf("") }
    var paymentType by remember { mutableStateOf(PaymentType.CASH) }

    fun poishaOf(text: String): Long = ((text.toDoubleOrNull() ?: 0.0) * 100).toLong()

    val qty = quantity.toIntOrNull() ?: 0
    val sellingPoisha = poishaOf(sellingPrice)
    val buyingPoisha = poishaOf(buyingCost)
    val discountPoisha = poishaOf(discount)
    val paidPoisha = poishaOf(amountPaid)

    val totalAmount = (sellingPoisha * qty) - discountPoisha
    val amountDue = max(totalAmount - paidPoisha, 0)
    val changeAmount = max(paidPoisha - totalAmount, 0)

    val canSave = product != null && qty > 0 && sellingPoisha >= 0 && discountPoisha >= 0 && paidPoisha >= 0 && !saving

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Record Sale") },
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
            Text(product?.name ?: "Loading...", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Stock available: ${product?.currentStock ?: "-"}")
            Spacer(Modifier.height(16.dp))

            OutlinedTextField(
                value = quantity,
                onValueChange = { quantity = it.filter(Char::isDigit) },
                label = { Text("Quantity") },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            Row {
                OutlinedTextField(value = sellingPrice, onValueChange = { sellingPrice = it }, label = { Text("Selling price each (৳)") }, modifier = Modifier.weight(1f))
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = buyingCost, onValueChange = { buyingCost = it }, label = { Text("Buying cost each (৳)") }, modifier = Modifier.weight(1f))
            }
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(value = discount, onValueChange = { discount = it }, label = { Text("Discount (৳)") }, modifier = Modifier.fillMaxWidth())

            Spacer(Modifier.height(16.dp))
            Text("Payment Type", style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PaymentType.entries.forEach { type ->
                    FilterChip(
                        selected = paymentType == type,
                        onClick = { paymentType = type },
                        label = { Text(type.name.replace('_', ' ')) },
                    )
                }
            }

            Spacer(Modifier.height(8.dp))
            OutlinedTextField(value = amountPaid, onValueChange = { amountPaid = it }, label = { Text("Amount paid (৳)") }, modifier = Modifier.fillMaxWidth())

            Spacer(Modifier.height(16.dp))
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Total: ${formatPoisha(totalAmount)}")
                    Text("Amount due: ${formatPoisha(amountDue)}")
                    Text("Change: ${formatPoisha(changeAmount)}")
                }
            }

            error?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.error)
            }

            Spacer(Modifier.height(16.dp))
            Button(
                onClick = {
                    viewModel.recordSale(
                        productId = productId,
                        quantity = qty,
                        sellingPriceEachPoisha = sellingPoisha,
                        buyingCostEachPoisha = buyingPoisha,
                        discountPoisha = discountPoisha,
                        paymentType = paymentType,
                        amountPaid = paidPoisha,
                        onSuccess = onSaleRecorded,
                    )
                },
                enabled = canSave,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (saving) "Saving..." else "Complete Sale")
            }
        }
    }
}
