package com.fumak.scanner.data.connection

/** One saved desktop connection (e.g. "Home", "Office"). */
data class ConnectionProfile(
    val id: String,
    val name: String,
    val host: String,
    val port: Int = 3000,
) {
    val baseUrl: String get() = "http://$host:$port/"
}
