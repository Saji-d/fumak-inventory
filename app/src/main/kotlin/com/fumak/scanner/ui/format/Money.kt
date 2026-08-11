package com.fumak.scanner.ui.format

import java.util.Locale

/** Formats integer poisha (1/100 BDT) as a BDT display string, e.g. 123456 -> "৳1234.56". */
fun formatPoisha(poisha: Long): String = String.format(Locale.US, "৳%.2f", poisha / 100.0)
