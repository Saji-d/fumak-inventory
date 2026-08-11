<div align="center">

<img src="logo.jpeg" alt="FUMAK logo" width="140" />

# FUMAK Inventory Management System

**A lightweight, offline-first inventory and sales companion for FUMAK — built for clothing, shoes, bags, and accessories retail.**

![Platform](https://img.shields.io/badge/platform-Android-3DDC84?logo=android&logoColor=white)
![Language](https://img.shields.io/badge/language-Kotlin-7F52FF?logo=kotlin&logoColor=white)
![UI](https://img.shields.io/badge/UI-Jetpack%20Compose-4285F4?logo=jetpackcompose&logoColor=white)
![Min SDK](https://img.shields.io/badge/minSdk-24-blue)
![Target SDK](https://img.shields.io/badge/targetSdk-35-blue)
![Storage](https://img.shields.io/badge/storage-Room%20(local%20only)-yellow)
![Status](https://img.shields.io/badge/status-active%20development-orange)

</div>

---

## Overview

FUMAK is a small, single-shop internal Android application that turns a phone's camera into a barcode-driven inventory and point-of-sale tool. It solves a narrow, concrete problem: FUMAK sells physical products (clothing, shoes, bags, accessories) that already carry manufacturer barcodes, and the shop needs a fast way to look up a product by scanning it, keep stock counts accurate, record sales with realistic payment details (partial payments, discounts, change), and see simple revenue numbers over time — without adopting a full point-of-sale or accounting suite.

FUMAK is intentionally **not** a general-purpose POS, not an accounting system, and does not generate barcodes. It reads the barcodes already printed on FUMAK's products and builds inventory and sales records around them.

## Key Features

### Barcode Scanning
- Live camera-based barcode scanning using **CameraX** and **Google ML Kit Barcode Scanning**
- Fully on-device, offline recognition (no network call to decode a barcode)
- Per-value scan cooldown so a code held in frame doesn't re-trigger repeatedly
- Reads existing physical product barcodes — the app never generates barcodes

### Product Management
- Look up a scanned barcode against the local product catalog
- Register a new product on the spot when a barcode isn't recognized
- Product record: name, category, color, size/variant, buying price, selling price, current stock, barcode value, and barcode format

### Inventory Management
- Add stock, remove stock, and adjust stock to an absolute counted value
- Every stock-affecting event — including automatic deductions from a sale — is written to a per-product inventory transaction history, with the resulting stock level snapshotted on each entry

### Sales
- Record a sale against a scanned/looked-up product: quantity, selling price, buying cost, discount, payment type, amount paid
- Amount due and change are computed automatically from the total and amount paid
- A completed sale atomically decrements stock and logs the deduction in the inventory history

### Revenue Analytics
- Summary tiles for total revenue, items sold, buying cost, gross profit, discounts, amount paid, and amount due
- Period filters: Today, Current Month, Last 3 Months, Last 6 Months, Current Year, and a custom date range
- A tap-to-inspect revenue-over-time bar chart, switchable between 3-month, 6-month, and 1-year views

## How It Works

```
Phone Camera
     │
     ▼
CameraX (image analysis stream)
     │
     ▼
Google ML Kit Barcode Scanning
     │
     ▼
Decoded Barcode Value + Format
     │
     ▼
Product Lookup  ──── not found ────▶  Register New Product
     │ found
     ▼
Product Detail  ──▶  Inventory Actions (Add / Remove / Adjust)
     │
     ▼
Record Sale  ──▶  Stock Deduction + Inventory Transaction
     │
     ▼
Revenue Analytics (summaries + chart)
```

Only the stages actually implemented are shown above — there is no server, sync, or queueing layer in the current build.

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Language | Kotlin | 2.0.21 |
| UI | Jetpack Compose | Material 3, `compose-bom:2024.09.02` |
| Navigation | Navigation Compose | `2.8.3` — Scanner → Product Detail → Register Product → Record Sale → Analytics |
| Camera | CameraX | `1.3.4` (`camera-core`, `camera-camera2`, `camera-lifecycle`, `camera-view`) |
| Barcode Scanning | Google ML Kit Barcode Scanning | `17.3.0`, on-device/bundled model |
| Local Database | Room | `2.6.1`, with KSP (`2.0.21-1.0.27`) for annotation processing |
| Build System | Gradle (Kotlin DSL) | Gradle `8.9`, Android Gradle Plugin `8.6.0` |
| Android SDK | `minSdk 24` / `compileSdk 35` / `targetSdk 35` | Java 17 toolchain |

## Data Model

All entities live under `app/src/main/kotlin/com/fumak/scanner/data/`, one Room database (`FumakDatabase`, schema version 1). Monetary fields are stored as integer **poisha** (1/100 BDT) rather than floating point, to avoid rounding drift when summing sales.

| Entity | Table | Purpose |
|---|---|---|
| `ProductEntity` | `products` | A sellable item: barcode value/format, name, category, color, variant, buying/selling price, current stock. `barcodeValue` is uniquely indexed for fast scan lookups. |
| `InventoryTransactionEntity` | `inventory_transactions` | Full audit log of every stock change — `ADD`, `REMOVE`, `ADJUST`, or `SALE` — with the signed quantity delta and the resulting stock level snapshotted on each row. |
| `SaleEntity` | `sales` | The header of a completed sale: timestamp, payment type, total amount, amount paid, amount due, change amount. |
| `SaleItemEntity` | `sale_items` | The product line within a sale: quantity, and the selling price / buying cost / discount *as they were at the time of sale* (so historical gross-profit figures stay correct even after a product's prices later change). |

Analytics are read-only projections over the same tables (`AnalyticsDao`, `AnalyticsRepository`) rather than separate stored entities:
- `RevenueSummary` / `PeriodReport` — aggregated totals (revenue, items sold, buying cost, discount, paid, due) for a given date range, with gross profit derived as revenue minus buying cost
- `RevenuePointRow` / `RevenueChartPoint` — raw and time-bucketed points used to draw the revenue chart

## Barcode Scanning

Scanning is deliberately isolated in its own package, `app/src/main/kotlin/com/fumak/scanner/scanner/`, behind a small `BarcodeScannerEngine` interface — the rest of the app depends only on that interface and on the app's own `BarcodeFormat` enum, never on ML Kit types directly.

- **Camera source**: CameraX binds a `Preview` and an `ImageAnalysis` use case to the activity lifecycle; each analyzed frame is handed to the scanner engine.
- **Decoding**: `MlKitBarcodeScannerEngine` wraps ML Kit's `BarcodeScanning` client and maps ML Kit's format constants onto the app's own `BarcodeFormat` enum.
- **Formats currently configured**: `EAN_13`, `EAN_8`, `UPC_A`, `UPC_E`, `CODE_128`, `CODE_39`, `CODE_93`, `QR_CODE` (see `ScannerConfig.FUMAK_DEFAULT_FORMATS`). This list is a starting configuration for whatever symbologies FUMAK's product labels turn out to use — it is not a claim that FUMAK standardizes on one particular barcode format.
- **Barcode value extraction**: the raw decoded string is kept as-is (never parsed as a number), so leading zeros in EAN/UPC codes are preserved.
- **Product lookup**: on each decode, the value is looked up against `ProductEntity.barcodeValue`. A match surfaces a "View Product" action; no match surfaces a "Register New Product" action — both are tap-to-confirm, so scanning several items in a row is never interrupted by an automatic screen change.
- **No barcode generation**: the app only reads barcodes that already exist on FUMAK's physical products.

## Inventory Workflow

1. Point the camera at a product's barcode. A successful decode shows the barcode value and format on screen.
2. If the barcode matches a known product, tap **View Product** to open its detail screen (name, category, color, variant, buying/selling price, current stock, barcode).
3. If the barcode is unrecognized, tap **Register New Product** and fill in its details to add it to the catalog.
4. From the product detail screen, use **Add**, **Remove**, or **Adjust** to change stock:
   - Add / Remove apply a relative quantity change.
   - Adjust sets stock to an absolute counted value (e.g. after a physical stock take).
5. Every change appears immediately in that product's stock history list, most recent first.

## Sales Workflow

1. From a product's detail screen, tap **Record Sale**.
2. Enter quantity, selling price, buying cost, discount, payment type (Cash, Card, Mobile Money, Other), and amount paid.
3. The app computes, live, as figures are entered:
   - **Total** = (selling price × quantity) − discount
   - **Amount due** = max(total − amount paid, 0)
   - **Change** = max(amount paid − total, 0)
4. Completing the sale, in one atomic database transaction:
   - Inserts the sale header and its product line (with price/cost snapshotted at sale time)
   - Decrements the product's stock by the quantity sold
   - Logs the deduction as a `SALE`-type inventory transaction linked back to the sale

If the requested quantity would take stock below zero, the sale is rejected rather than allowing negative stock.

## Analytics

The Analytics screen reports, for a selected period:

- Total revenue
- Total items sold
- Total buying cost
- Gross profit (revenue − buying cost)
- Total discounts
- Total amount paid
- Total amount due

**Period filters**: Today, Current Month, Last 3 Months, Last 6 Months, Current Year, and a custom start/end date range.

**Revenue-over-time chart**: a hand-drawn Compose `Canvas` bar chart (no third-party charting library), switchable between 3-month, 6-month, and 1-year windows. Shorter windows bucket revenue by week; the 1-year window buckets by calendar month. Tapping a bar shows that bucket's exact amount.

This is deliberately a small set of business metrics, not a general ledger, tax report, or accounting statement — FUMAK does not implement double-entry bookkeeping, tax handling, or payroll.

## Local Data Storage

All data is persisted **locally on the device** using Room (SQLite), via a single `fumak.db` database file in the app's private storage. There is currently:

- **No cloud backend** of any kind
- **No multi-device synchronization** — data entered on one phone is not visible on another
- **No remote backup** — uninstalling the app or clearing its data removes the database

This matches the barcode scanner's own fully offline design: the entire app works with no network connection.

## Project Structure

```
app/src/main/kotlin/com/fumak/scanner/
├── scanner/                      # Camera + ML Kit barcode scanning, isolated behind BarcodeScannerEngine
│   ├── BarcodeScannerEngine.kt
│   ├── MlKitBarcodeScannerEngine.kt
│   ├── BarcodeFormat.kt
│   ├── BarcodeScanResult.kt
│   └── ScannerConfig.kt
│
├── data/                         # Room database, entities, DAOs, repositories
│   ├── FumakDatabase.kt
│   ├── Converters.kt
│   ├── product/                  # ProductEntity, ProductDao, ProductRepository
│   ├── inventory/                # InventoryTransactionEntity, InventoryTransactionDao, InventoryRepository
│   ├── sales/                    # SaleEntity, SaleItemEntity, SaleDao, SaleItemDao, SalesRepository
│   └── analytics/                # AnalyticsDao, AnalyticsRepository, AnalyticsPeriod
│
├── ui/                            # Screens and ViewModels, one package per feature
│   ├── nav/                      # Route definitions, FumakNavHost
│   ├── scanner/                  # ScannerViewModel (barcode → product lookup state)
│   ├── product/                  # ProductDetailScreen, RegisterProductScreen, ProductViewModel
│   ├── sales/                    # RecordSaleScreen, SaleViewModel
│   ├── analytics/                # AnalyticsScreen, RevenueChart, AnalyticsViewModel
│   └── format/                   # Money.kt — poisha → BDT display formatting
│
├── AppContainer.kt               # Hand-rolled dependency container (no DI framework)
├── FumakApplication.kt           # Owns AppContainer for the app's lifetime
└── MainActivity.kt               # Hosts the NavHost; the Scanner screen's camera/permission logic lives here
```

## Getting Started

**Prerequisites**: Android Studio (Koala or newer recommended), a JDK 17 toolchain, and either a physical Android device (API 24+) with USB debugging or an emulator.

1. Clone the repository:
   ```bash
   git clone https://github.com/Saji-d/fumak-inventory.git
   cd fumak-inventory
   ```
2. Open the project folder in Android Studio and let Gradle sync (it will download the Gradle 8.9 distribution and all dependencies listed above on first sync).
3. Connect an Android device over USB, or start an emulator from the Device Manager.
4. If using a physical device, enable **Developer Options** and **USB Debugging** (Settings → About Phone → tap "Build number" 7 times → Settings → Developer Options → USB Debugging).
5. Run the app from Android Studio (**Run ▸ Run 'app'**), or from the command line:
   ```bash
   # Windows
   .\gradlew.bat assembleDebug
   adb install -r app\build\outputs\apk\debug\app-debug.apk

   # macOS / Linux
   ./gradlew assembleDebug
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```
   > On Windows, prefer `gradlew.bat` — the POSIX `gradlew` script's default JVM options are not reliably parsed by all Windows shells.
6. On first launch, grant the requested **Camera** permission to use the scanner.

## Testing

There is no automated test suite yet; verification is manual, on-device:

1. **Camera permission** — first launch should prompt for Camera access; denying it should show the in-app permission message instead of crashing.
2. **Real barcode scanning** — point the camera at a real product barcode and confirm the decoded value and format appear on screen.
3. **Existing product lookup** — scan a barcode already registered in the catalog and confirm the "View Product" action opens the correct product with its stored details.
4. **New product registration** — scan an unrecognized barcode, use "Register New Product", fill in the form, and confirm the product can immediately be found by scanning the same barcode again.
5. **Inventory changes** — use Add / Remove / Adjust on a product and confirm the stock count updates and a corresponding entry appears in its transaction history.
6. **Sales** — record a sale with a discount and a partial payment, and confirm the computed due/change amounts are correct and that stock decreases by the sold quantity.
7. **Analytics** — after recording a sale, open Analytics and confirm it appears in the relevant period's totals, then switch between period filters and chart ranges (3M/6M/1Y).

## Current Limitations

- **Local-only data** — everything lives in a single on-device Room database.
- **No cloud synchronization** and **no multi-device synchronization** — each device has its own independent dataset.
- **No full accounting system** — no tax handling, no double-entry bookkeeping, no payroll.
- **No barcode generation** — the app only reads barcodes already printed on FUMAK's products.
- **No automated tests** — verification is currently manual and on-device only.
- **Single-item sales** — the sale-recording screen records one product per sale; the underlying schema (separate sale header and sale item tables) was designed to support multi-item sales later without a data migration, but that UI does not exist yet.

## Roadmap

**Currently implemented** (see Key Features above): barcode scanning, product lookup/registration, inventory management with history, single-item sales recording, and local revenue analytics with a chart.

**Future ideas** (not implemented — listed for direction only):
- Backend / cloud database
- Multi-device synchronization
- Web or admin dashboard
- Authentication and user roles
- Supplier management
- Multi-item sales (cart-style checkout)
- More advanced reporting

## Screenshots

No in-app screenshots are currently checked into this repository. This section will be updated once they're available.

## License

This project currently has no explicit license file. All rights are reserved by default until a license is added.

## Author

**Sajidur Rahman Sajid**

- GitHub: [github.com/Saji-d](https://github.com/Saji-d)
- Portfolio: [sajidur.me](https://sajidur.me)
