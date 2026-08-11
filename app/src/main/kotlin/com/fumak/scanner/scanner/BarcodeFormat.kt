package com.fumak.scanner.scanner

/**
 * Our own barcode-format vocabulary. Nothing outside this package should ever
 * reference an ML Kit format constant directly — this enum is what the rest
 * of the app (and, later, the inventory backend) is written against, so the
 * underlying detection engine can be swapped without touching callers.
 */
enum class BarcodeFormat {
    EAN_13,
    EAN_8,
    UPC_A,
    UPC_E,
    CODE_128,
    CODE_39,
    CODE_93,
    QR_CODE,
    UNKNOWN,
}
