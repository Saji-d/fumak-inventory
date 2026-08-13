package com.fumak.scanner

import android.content.Context
import com.fumak.scanner.data.connection.ConnectionProfileStore

/** Hand-rolled DI — no Hilt/Koin, matching this app's dependency-light approach. */
class AppContainer(context: Context) {
    val connectionProfileStore by lazy { ConnectionProfileStore(context) }
}
