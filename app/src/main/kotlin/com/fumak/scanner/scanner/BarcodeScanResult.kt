package com.fumak.scanner.scanner

/**
 * The one type the rest of the app (and later the inventory backend) should
 * depend on. Produced by whatever [BarcodeScannerEngine] is currently wired
 * up — today ML Kit, potentially something else tomorrow.
 *
 * @param value raw decoded barcode payload
 * @param format decoded symbology, in our own [BarcodeFormat] vocabulary
 * @param timestamp wall-clock time (epoch millis) the scan was confirmed
 * @param latencyMs approximate time from frame capture to decoded result
 */
data class BarcodeScanResult(
    val value: String,
    val format: BarcodeFormat,
    val timestamp: Long,
    val latencyMs: Long,
)
