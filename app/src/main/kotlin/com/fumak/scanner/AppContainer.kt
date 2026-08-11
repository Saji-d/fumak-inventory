package com.fumak.scanner

import android.content.Context
import com.fumak.scanner.data.FumakDatabase
import com.fumak.scanner.data.analytics.AnalyticsRepository
import com.fumak.scanner.data.inventory.InventoryRepository
import com.fumak.scanner.data.product.ProductRepository
import com.fumak.scanner.data.sales.SalesRepository

/** Hand-rolled DI — no Hilt/Koin, matching this app's dependency-light approach. */
class AppContainer(context: Context) {
    private val database by lazy { FumakDatabase.getInstance(context) }

    val productRepository by lazy { ProductRepository(database) }
    val inventoryRepository by lazy { InventoryRepository(database) }
    val salesRepository by lazy { SalesRepository(database, inventoryRepository) }
    val analyticsRepository by lazy { AnalyticsRepository(database) }
}
