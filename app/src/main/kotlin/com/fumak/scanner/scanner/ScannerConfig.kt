package com.fumak.scanner.scanner

/**
 * The barcode formats FUMAK is expected to encounter. This is a starting
 * guess, not a confirmed fact — the Xprinter XP-350BM can emit several
 * symbologies, so this list gets narrowed (or widened) once real product
 * labels have been tested against the scanner.
 */
val FUMAK_DEFAULT_FORMATS: Set<BarcodeFormat> = setOf(
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.QR_CODE,
)

/**
 * @param enabledFormats formats the engine should restrict detection to —
 *   narrowing this list is a real ML Kit performance win, not just noise reduction.
 * @param cooldownMs minimum time before the same barcode value is reported again,
 *   so a barcode held in frame for several seconds only produces one result.
 */
data class ScannerConfig(
    val enabledFormats: Set<BarcodeFormat> = FUMAK_DEFAULT_FORMATS,
    val cooldownMs: Long = 1500L,
)
