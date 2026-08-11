package com.fumak.scanner.scanner

import androidx.camera.core.ImageProxy

/**
 * Abstraction over "something that can find a barcode in a camera frame."
 * [MlKitBarcodeScannerEngine] is the only implementation today; the point of
 * this interface is that it's the *only* one that needs to exist for the app
 * to work with a different on-device scanner later — everything upstream
 * (analyzer, ViewModel, UI) only ever sees [BarcodeScanResult].
 *
 * [processFrame] takes ownership of closing [imageProxy]; callers must not
 * close it themselves.
 */
interface BarcodeScannerEngine : AutoCloseable {
    fun processFrame(
        imageProxy: ImageProxy,
        onResult: (BarcodeScanResult) -> Unit,
        onError: (Exception) -> Unit,
    )
}
