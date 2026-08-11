package com.fumak.scanner.ui.nav

import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.fumak.scanner.AppContainer
import com.fumak.scanner.scanner.BarcodeFormat
import com.fumak.scanner.ui.analytics.AnalyticsScreen
import com.fumak.scanner.ui.product.ProductDetailScreen
import com.fumak.scanner.ui.product.RegisterProductScreen
import com.fumak.scanner.ui.sales.RecordSaleScreen

/**
 * [scannerContent] is a slot for the existing (frozen) Scanner screen, which lives in
 * `MainActivity.kt` because it wraps a `private` composable there — this host never touches it.
 */
@Composable
fun FumakNavHost(
    navController: NavHostController,
    appContainer: AppContainer,
    scannerContent: @Composable () -> Unit,
) {
    NavHost(navController = navController, startDestination = Routes.SCANNER) {
        composable(Routes.SCANNER) { scannerContent() }

        composable(
            Routes.PRODUCT_DETAIL_PATTERN,
            arguments = listOf(navArgument("productId") { type = NavType.LongType }),
        ) { backStackEntry ->
            val productId = backStackEntry.arguments?.getLong("productId") ?: return@composable
            ProductDetailScreen(
                productId = productId,
                productRepository = appContainer.productRepository,
                inventoryRepository = appContainer.inventoryRepository,
                onBack = { navController.popBackStack() },
                onRecordSale = { id -> navController.navigate(Routes.recordSale(id)) },
            )
        }

        composable(
            Routes.REGISTER_PRODUCT_PATTERN,
            arguments = listOf(
                navArgument("barcode") { type = NavType.StringType },
                navArgument("format") { type = NavType.StringType },
            ),
        ) { backStackEntry ->
            val barcode = Uri.decode(backStackEntry.arguments?.getString("barcode") ?: "")
            val format = runCatching {
                BarcodeFormat.valueOf(backStackEntry.arguments?.getString("format") ?: "")
            }.getOrDefault(BarcodeFormat.UNKNOWN)

            RegisterProductScreen(
                barcode = barcode,
                format = format,
                productRepository = appContainer.productRepository,
                inventoryRepository = appContainer.inventoryRepository,
                onBack = { navController.popBackStack() },
                onSaved = { productId ->
                    navController.navigate(Routes.productDetail(productId)) {
                        popUpTo(Routes.SCANNER)
                    }
                },
            )
        }

        composable(
            Routes.RECORD_SALE_PATTERN,
            arguments = listOf(navArgument("productId") { type = NavType.LongType }),
        ) { backStackEntry ->
            val productId = backStackEntry.arguments?.getLong("productId") ?: return@composable
            RecordSaleScreen(
                productId = productId,
                productRepository = appContainer.productRepository,
                salesRepository = appContainer.salesRepository,
                onBack = { navController.popBackStack() },
                onSaleRecorded = { navController.popBackStack(Routes.SCANNER, inclusive = false) },
            )
        }

        composable(Routes.ANALYTICS) {
            AnalyticsScreen(
                analyticsRepository = appContainer.analyticsRepository,
                onBack = { navController.popBackStack() },
            )
        }
    }
}
