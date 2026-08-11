@file:OptIn(ExperimentalMaterial3Api::class)

package com.fumak.scanner.ui.product

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.fumak.scanner.data.inventory.InventoryRepository
import com.fumak.scanner.data.inventory.InventoryTransactionEntity
import com.fumak.scanner.data.product.ProductEntity
import com.fumak.scanner.data.product.ProductRepository
import com.fumak.scanner.ui.format.formatPoisha
import java.text.SimpleDateFormat
import java.util.Locale

@Composable
fun ProductDetailScreen(
    productId: Long,
    productRepository: ProductRepository,
    inventoryRepository: InventoryRepository,
    onBack: () -> Unit,
    onRecordSale: (Long) -> Unit,
) {
    val viewModel: ProductViewModel = viewModel(
        factory = ProductViewModel.factory(productRepository, inventoryRepository, productId),
    )
    val product by viewModel.product.collectAsState()
    val history by viewModel.history.collectAsState()
    val actionError by viewModel.actionError.collectAsState()

    var showAddDialog by remember { mutableStateOf(false) }
    var showRemoveDialog by remember { mutableStateOf(false) }
    var showAdjustDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(product?.name ?: "Product") },
                navigationIcon = { IconButton(onClick = onBack) { Text("←", fontSize = 20.sp) } },
            )
        },
    ) { padding ->
        val current = product
        if (current == null) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
            ) {
                ProductInfoCard(current)

                Spacer(Modifier.height(16.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    Button(onClick = { showAddDialog = true }, modifier = Modifier.weight(1f)) { Text("Add") }
                    Button(onClick = { showRemoveDialog = true }, modifier = Modifier.weight(1f)) { Text("Remove") }
                    Button(onClick = { showAdjustDialog = true }, modifier = Modifier.weight(1f)) { Text("Adjust") }
                }

                Spacer(Modifier.height(12.dp))

                Button(onClick = { onRecordSale(current.id) }, modifier = Modifier.fillMaxWidth()) {
                    Text("Record Sale")
                }

                actionError?.let {
                    Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp))
                }

                Spacer(Modifier.height(24.dp))
                Text("Stock History", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(8.dp))
                if (history.isEmpty()) {
                    Text("No stock changes yet.")
                } else {
                    history.forEach { tx -> InventoryHistoryRow(tx) }
                }
            }
        }
    }

    val activeProductId = product?.id
    if (showAddDialog && activeProductId != null) {
        QuantityDialog(
            title = "Add Stock",
            confirmLabel = "Add",
            onDismiss = { showAddDialog = false },
            onConfirm = { qty -> viewModel.addStock(activeProductId, qty); showAddDialog = false },
        )
    }
    if (showRemoveDialog && activeProductId != null) {
        QuantityDialog(
            title = "Remove Stock",
            confirmLabel = "Remove",
            onDismiss = { showRemoveDialog = false },
            onConfirm = { qty -> viewModel.removeStock(activeProductId, qty); showRemoveDialog = false },
        )
    }
    if (showAdjustDialog && activeProductId != null) {
        AdjustStockDialog(
            currentStock = product?.currentStock ?: 0,
            onDismiss = { showAdjustDialog = false },
            onConfirm = { newStock, reason ->
                viewModel.adjustStock(activeProductId, newStock, reason)
                showAdjustDialog = false
            },
        )
    }
}

@Composable
private fun ProductInfoCard(product: ProductEntity) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(product.name, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text("Category: ${product.category}")
            product.color?.let { Text("Color: $it") }
            product.variant?.let { Text("Size/Variant: $it") }
            Spacer(Modifier.height(8.dp))
            Text("Buying price: ${formatPoisha(product.buyingPricePoisha)}")
            Text("Selling price: ${formatPoisha(product.sellingPricePoisha)}")
            Spacer(Modifier.height(8.dp))
            Text(
                "Current stock: ${product.currentStock}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            Text("Barcode: ${product.barcodeValue} (${product.barcodeFormat.name})")
        }
    }
}

@Composable
private fun InventoryHistoryRow(tx: InventoryTransactionEntity) {
    val dateFormat = remember { SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.getDefault()) }
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("${tx.type.name} (${if (tx.quantityDelta >= 0) "+" else ""}${tx.quantityDelta})", fontWeight = FontWeight.SemiBold)
            Text("stock: ${tx.resultingStock}")
        }
        Text(dateFormat.format(tx.timestamp), style = MaterialTheme.typography.bodySmall)
        tx.reason?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
    }
}

@Composable
private fun QuantityDialog(
    title: String,
    confirmLabel: String,
    onDismiss: () -> Unit,
    onConfirm: (Int) -> Unit,
) {
    var text by remember { mutableStateOf("") }
    val quantity = text.toIntOrNull()
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            OutlinedTextField(
                value = text,
                onValueChange = { text = it.filter(Char::isDigit) },
                label = { Text("Quantity") },
                singleLine = true,
            )
        },
        confirmButton = {
            TextButton(onClick = { quantity?.let(onConfirm) }, enabled = quantity != null && quantity > 0) {
                Text(confirmLabel)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

@Composable
private fun AdjustStockDialog(
    currentStock: Int,
    onDismiss: () -> Unit,
    onConfirm: (newStock: Int, reason: String?) -> Unit,
) {
    var text by remember { mutableStateOf(currentStock.toString()) }
    var reason by remember { mutableStateOf("") }
    val newStock = text.toIntOrNull()
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Adjust Stock") },
        text = {
            Column {
                Text("Enter the actual counted stock (absolute value, not a delta).")
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = text,
                    onValueChange = { text = it.filter(Char::isDigit) },
                    label = { Text("New stock count") },
                    singleLine = true,
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("Reason (optional)") },
                    singleLine = true,
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { newStock?.let { onConfirm(it, reason.ifBlank { null }) } }, enabled = newStock != null) {
                Text("Save")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
