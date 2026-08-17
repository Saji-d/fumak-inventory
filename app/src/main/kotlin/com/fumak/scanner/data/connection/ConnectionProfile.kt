package com.fumak.scanner.data.connection

/** One saved desktop connection (e.g. "Home", "Office"). */
data class ConnectionProfile(
    val id: String,
    val name: String,
    val host: String,
    val port: Int = 3000,
) {
    // LAN desktops are entered as a bare IP (e.g. "192.168.1.23") and always speak
    // plain HTTP on the given port. A production server (e.g. Vercel) needs HTTPS
    // with no explicit port, so a host already carrying a scheme is used as-is
    // instead of forcing "http://" and ":$port" onto it.
    private val hasScheme: Boolean get() = host.startsWith("http://") || host.startsWith("https://")

    val baseUrl: String get() = if (hasScheme) host.trimEnd('/') + "/" else "http://$host:$port/"

    /** Human-readable address for the profile list — no scheme/port noise for full URLs. */
    val displayAddress: String get() = if (hasScheme) host else "$host:$port"
}
