package com.fumak.scanner.scanner

import android.os.SystemClock
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage

/**
 * [BarcodeScannerEngine] backed by ML Kit's bundled on-device barcode model.
 *
 * Enforces [ScannerConfig.cooldownMs] per distinct barcode value so a code
 * held in frame for several seconds only reaches [processFrame]'s caller once,
 * while a different code in the same frame stream is still reported immediately.
 */
class MlKitBarcodeScannerEngine(
    config: ScannerConfig = ScannerConfig(),
) : BarcodeScannerEngine {

    private val cooldownMs = config.cooldownMs
    private val lastReportedAt = mutableMapOf<String, Long>()

    private val scanner = BarcodeScanning.getClient(
        BarcodeScannerOptions.Builder()
            .setBarcodeFormats(config.enabledFormats.toMlKitFormatMask())
            .build()
    )

    override fun processFrame(
        imageProxy: ImageProxy,
        onResult: (BarcodeScanResult) -> Unit,
        onError: (Exception) -> Unit,
    ) {
        val mediaImage = imageProxy.image
        if (mediaImage == null) {
            imageProxy.close()
            return
        }

        val frameReceivedAt = SystemClock.elapsedRealtime()
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                val barcode = barcodes.firstOrNull { !it.rawValue.isNullOrEmpty() } ?: return@addOnSuccessListener
                val value = barcode.rawValue!!
                val now = System.currentTimeMillis()

                val last = lastReportedAt[value]
                if (last != null && now - last < cooldownMs) return@addOnSuccessListener

                lastReportedAt[value] = now
                onResult(
                    BarcodeScanResult(
                        value = value,
                        format = barcode.format.toBarcodeFormat(),
                        timestamp = now,
                        latencyMs = SystemClock.elapsedRealtime() - frameReceivedAt,
                    )
                )
            }
            .addOnFailureListener(onError)
            .addOnCompleteListener { imageProxy.close() }
    }

    override fun close() {
        scanner.close()
    }
}

/** Combines our formats into the bitmask [BarcodeScannerOptions.Builder.setBarcodeFormats] expects. */
private fun Set<BarcodeFormat>.toMlKitFormatMask(): Int {
    val mlKitFormats = map { it.toMlKitFormat() }
    return mlKitFormats.reduceOrNull { acc, format -> acc or format } ?: Barcode.FORMAT_ALL_FORMATS
}

private fun BarcodeFormat.toMlKitFormat(): Int = when (this) {
    BarcodeFormat.EAN_13 -> Barcode.FORMAT_EAN_13
    BarcodeFormat.EAN_8 -> Barcode.FORMAT_EAN_8
    BarcodeFormat.UPC_A -> Barcode.FORMAT_UPC_A
    BarcodeFormat.UPC_E -> Barcode.FORMAT_UPC_E
    BarcodeFormat.CODE_128 -> Barcode.FORMAT_CODE_128
    BarcodeFormat.CODE_39 -> Barcode.FORMAT_CODE_39
    BarcodeFormat.CODE_93 -> Barcode.FORMAT_CODE_93
    BarcodeFormat.QR_CODE -> Barcode.FORMAT_QR_CODE
    BarcodeFormat.UNKNOWN -> Barcode.FORMAT_UNKNOWN
}

private fun Int.toBarcodeFormat(): BarcodeFormat = when (this) {
    Barcode.FORMAT_EAN_13 -> BarcodeFormat.EAN_13
    Barcode.FORMAT_EAN_8 -> BarcodeFormat.EAN_8
    Barcode.FORMAT_UPC_A -> BarcodeFormat.UPC_A
    Barcode.FORMAT_UPC_E -> BarcodeFormat.UPC_E
    Barcode.FORMAT_CODE_128 -> BarcodeFormat.CODE_128
    Barcode.FORMAT_CODE_39 -> BarcodeFormat.CODE_39
    Barcode.FORMAT_CODE_93 -> BarcodeFormat.CODE_93
    Barcode.FORMAT_QR_CODE -> BarcodeFormat.QR_CODE
    else -> BarcodeFormat.UNKNOWN
}
