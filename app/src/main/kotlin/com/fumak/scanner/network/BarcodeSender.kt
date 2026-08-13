package com.fumak.scanner.network

import com.fumak.scanner.data.connection.ConnectionProfile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.IOException
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

sealed interface SendResult {
    data object Success : SendResult
    data class Failed(val message: String) : SendResult
}

/**
 * Posts a scanned barcode (or a lightweight heartbeat) to the desktop's
 * `POST /api/scanner/events` endpoint. Deliberately uses plain [HttpURLConnection] —
 * a single fire-and-forget POST doesn't justify pulling Retrofit/OkHttp back into
 * this app.
 */
object BarcodeSender {
    private const val CONNECT_TIMEOUT_MS = 2_000
    private const val READ_TIMEOUT_MS = 3_000

    suspend fun sendBarcode(profile: ConnectionProfile, barcode: String, format: String): SendResult =
        post(profile, """{"type":"scan","barcode":"${escape(barcode)}","format":"${escape(format)}"}""")

    suspend fun sendHeartbeat(profile: ConnectionProfile): SendResult =
        post(profile, """{"type":"heartbeat"}""")

    private suspend fun post(profile: ConnectionProfile, jsonBody: String): SendResult = withContext(Dispatchers.IO) {
        var connection: HttpURLConnection? = null
        try {
            val url = URL("${profile.baseUrl}api/scanner/events")
            connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                doOutput = true
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
                setRequestProperty("Content-Type", "application/json")
            }
            connection.outputStream.use { stream ->
                OutputStreamWriter(stream, Charsets.UTF_8).use { writer ->
                    writer.write(jsonBody)
                    writer.flush()
                }
            }
            val code = connection.responseCode
            if (code in 200..299) SendResult.Success else SendResult.Failed("Server error ($code)")
        } catch (e: IOException) {
            SendResult.Failed(e.message ?: "Can't reach the desktop")
        } finally {
            connection?.disconnect()
        }
    }

    private fun escape(value: String): String = value.replace("\\", "\\\\").replace("\"", "\\\"")
}
