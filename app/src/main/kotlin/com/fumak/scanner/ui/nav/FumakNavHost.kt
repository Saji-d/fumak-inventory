package com.fumak.scanner.ui.nav

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.fumak.scanner.AppContainer
import com.fumak.scanner.ui.connection.ConnectionSettingsScreen

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

        composable(Routes.CONNECTIONS) {
            ConnectionSettingsScreen(
                profileStore = appContainer.connectionProfileStore,
                onBack = { navController.popBackStack() },
            )
        }
    }
}
