package com.fumak.scanner.ui.product

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
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.fumak.scanner.data.inventory.InventoryRepository
import com.fumak.scanner.data.product.ProductRepository
import com.fumak.scanner.scanner.BarcodeFormat
import kotlinx.coroutines.launch

@Composable
fun RegisterProductScreen(
    barcode: String,
    format: BarcodeFormat,
    productRepository: ProductRepository,
    inventoryRepository: InventoryRepository,
    onBack: () -> Unit,
    onSaved: (productId: Long) -> Unit,
) {
    val viewModel: ProductViewModel = viewModel(
        factory = ProductViewModel.factory(productRepository, inventoryRepository, productId = null),
    )
    val scope = rememberCoroutineScope()

    var name by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var color by remember { mutableStateOf("") }
    var variant by remember { mutableStateOf("") }
    var buyingPrice by remember { mutableStateOf("") }
    var sellingPrice by remember { mutableStateOf("") }
    var initialStock by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    fun poishaOf(text: String): Long? = text.toDoubleOrNull()?.let { (it * 100).toLong() }

    val buyingPoisha = poishaOf(buyingPrice)
    val sellingPoisha = poishaOf(sellingPrice)
    val stockCount = initialStock.toIntOrNull() ?: 0
    val canSave = name.isNotBlank() && category.isNotBlank() && buyingPoisha != null && sellingPoisha != null && !saving

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Register Product") },
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
            Text("Barcode: $barcode (${format.name})", style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(16.dp))

            OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(value = category, onValueChange = { category = it }, label = { Text("Category") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Row {
                OutlinedTextField(value = color, onValueChange = { color = it }, label = { Text("Color (optional)") }, modifier = Modifier.weight(1f))
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = variant, onValueChange = { variant = it }, label = { Text("Size/Variant (optional)") }, modifier = Modifier.weight(1f))
            }
            Spacer(Modifier.height(8.dp))
            Row {
                OutlinedTextField(value = buyingPrice, onValueChange = { buyingPrice = it }, label = { Text("Buying price (৳)") }, modifier = Modifier.weight(1f))
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = sellingPrice, onValueChange = { sellingPrice = it }, label = { Text("Selling price (৳)") }, modifier = Modifier.weight(1f))
            }
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(value = initialStock, onValueChange = { initialStock = it.filter(Char::isDigit) }, label = { Text("Initial stock") }, modifier = Modifier.fillMaxWidth())

            error?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.error)
            }

            Spacer(Modifier.height(16.dp))
            Button(
                onClick = {
                    saving = true
                    scope.launch {
                        runCatching {
                            viewModel.registerProduct(
                                barcode = barcode,
                                format = format,
                                name = name,
                                category = category,
                                color = color.ifBlank { null },
                                variant = variant.ifBlank { null },
                                buyingPricePoisha = buyingPoisha!!,
                                sellingPricePoisha = sellingPoisha!!,
                                initialStock = stockCount,
                            )
                        }.onSuccess { productId ->
                            saving = false
                            onSaved(productId)
                        }.onFailure {
                            saving = false
                            error = it.message ?: "Failed to save product"
                        }
                    }
                },
                enabled = canSave,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (saving) "Saving..." else "Save Product")
            }
        }
    }
}
