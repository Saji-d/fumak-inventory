<div align="center">

<img src="logo.jpeg" alt="FUMAK logo" width="140" />

# FUMAK Inventory & POS System

**A two-part inventory, point-of-sale, and analytics system for FUMAK — an Android barcode-scanner remote paired with a Next.js desktop web app, built for clothing, shoes, bags, and accessories retail.**

![Platform](https://img.shields.io/badge/platform-Android%20%2B%20Web-3DDC84?logo=android&logoColor=white)
![Web](https://img.shields.io/badge/web-Next.js%2016-000000?logo=nextdotjs&logoColor=white)
![Language](https://img.shields.io/badge/mobile-Kotlin-7F52FF?logo=kotlin&logoColor=white)
![Database](https://img.shields.io/badge/database-Neon%20PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![ORM](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white)
![Storage](https://img.shields.io/badge/images-Cloudflare%20R2-F38020?logo=cloudflare&logoColor=white)
![Status](https://img.shields.io/badge/status-active%20development-orange)

</div>

---

## Overview

FUMAK solves a narrow, concrete problem for a single shop: sell physical products (clothing, shoes, bags, accessories) that already carry manufacturer barcodes, look them up fast, keep stock counts accurate, ring up sales with realistic payment details (cart, discounts, partial-payment-free checkout, change), and see revenue numbers over time — without adopting a full point-of-sale or accounting suite.

The system is split across two apps that talk to each other over the local Wi-Fi network:

- **`app/` — FUMAK Scanner (Android).** A thin, purpose-built barcode-scanning remote. It has no database of its own; it only decodes a barcode on-device with ML Kit and POSTs the value to the desktop web app.
- **`web/` — FUMAK Web (Next.js).** The actual inventory, POS, and analytics application. It owns all product/stock/sales data in a **Neon PostgreSQL** database (via Prisma), stores product photos in **Cloudflare R2**, and is where a staff member runs the shop from a browser (desktop or tablet) while a phone on the counter feeds it scanned barcodes in real time.

FUMAK is intentionally **not** a general-purpose POS, not an accounting system, and does not generate barcodes — it reads the barcodes already printed on FUMAK's products and builds inventory and sales records around them.

## Architecture

```
┌─────────────────────────┐        HTTP POST (LAN Wi-Fi)        ┌──────────────────────────────┐
│   Android FUMAK Scanner │  /api/scanner/events                │      FUMAK Web (Next.js)     │
│                          │ ───────────────────────────────────▶│                               │
│  CameraX + ML Kit        │   { type: "scan", barcode, format }  │  In-memory scan event queue   │
│  Barcode Scanning        │   { type: "heartbeat" }              │  (polled by the browser)      │
│                          │                                       │                               │
│  Saved "Desktop"         │                                       │  /sales page: live scan feed  │
│  connection profiles     │                                       │  → product lookup → cart →    │
│  (name, IP, port)        │                                       │    checkout                   │
└─────────────────────────┘                                       │                               │
                                                                    │  Prisma ORM                   │
                                                                    │       │                        │
                                                                    │       ▼                        │
                                                                    │  Neon PostgreSQL (products,    │
                                                                    │  inventory txns, sales, items, │
                                                                    │  settings)                     │
                                                                    │                               │
                                                                    │  Cloudflare R2 (product photos)│
                                                                    └──────────────────────────────┘
```

The phone never talks to the database or to R2 directly — it only knows the desktop's LAN IP and port. All business logic, validation, and persistence live in the Next.js API routes.

## Key Features

### Barcode Scanning (Android)
- Live camera-based barcode scanning using **CameraX** and **Google ML Kit Barcode Scanning**
- Fully on-device, offline decoding (no network call to *decode* a barcode — only the decoded value is sent onward)
- Formats configured: `EAN_13`, `EAN_8`, `UPC_A`, `UPC_E`, `CODE_128`, `CODE_39`, `CODE_93`, `QR_CODE`
- Saved **desktop connection profiles** (e.g. "Home", "Office" — name, IP address, port) so the same phone can pair with different desktops
- Sends each decoded barcode, plus a periodic heartbeat, to the paired desktop's `POST /api/scanner/events` so the web app can show a live Connected/Disconnected badge even between scans

### Product Management (Web)
- Full product catalog: name, category (Clothing / Shoes / Bags / Accessories), color, size/variant, buying price, selling price, current stock, barcode value/format, and an optional product photo
- Product photos are uploaded to Cloudflare R2 and referenced by key — never stored as binary data in Postgres
- Look up a scanned barcode against the catalog from the desktop; register a new product on the spot when a barcode isn't recognized
- Soft-delete only — products are archived, never hard-deleted, so historical sales stay intact

### Inventory Management (Web)
- Add stock, remove stock, or adjust stock to an absolute counted value
- Every stock-affecting event — including automatic deductions from a sale — is written to a full audit log (`InventoryTransaction`), with the resulting stock level snapshotted on each entry
- Low-stock threshold (configurable in Settings) drives low-stock counts on the dashboard

### Point of Sale (Web `/sales`)
- A live scan panel shows barcodes arriving from the paired phone in real time (short-poll on `/api/scanner/events`) and resolves them against the product catalog
- Multi-item cart: add/increment items, adjust quantity, apply a per-line discount, remove lines — cart state is mirrored into `sessionStorage` so an accidental refresh doesn't lose it
- Checkout computes total, amount due, and change live, then atomically (in one DB transaction) inserts the sale + line items, decrements stock, and logs a `SALE` inventory transaction per item
- A completed sale can only be checked out once the amount paid covers the total — there is no partial-payment/credit tracking
- Printable/shareable sale receipt with a derived invoice number (`FUMAK-<year>-<sale id>`)

### Dashboard & Analytics (Web)
- **Dashboard** (`/`): interactive KPI tiles (today's revenue, items sold, gross profit, total stock, low-stock count), a category breakdown, a revenue mini-chart, and the most recent sales
- **Analytics** (`/analytics`): revenue, items sold, buying cost, gross profit, discounts, amount paid, and amount due for a selected period (Today, Current Month, Last 3/6 Months, Current Year, or a custom date range), plus a tap-to-inspect revenue-over-time bar chart (weekly or monthly buckets)
- **Settings** (`/settings`): shop-wide low-stock threshold and currency symbol

## Tech Stack

### Android Scanner App (`app/`)

| Layer | Technology | Notes |
|---|---|---|
| Language | Kotlin | 2.0.21 |
| UI | Jetpack Compose | Material 3, `compose-bom:2024.09.02` |
| Navigation | Navigation Compose | `2.8.3` — Scanner ⇄ Desktop Connection settings |
| Camera | CameraX | `1.3.4` (`camera-core`, `camera-camera2`, `camera-lifecycle`, `camera-view`) |
| Barcode Scanning | Google ML Kit Barcode Scanning | `17.3.0`, on-device/bundled model |
| Networking | `java.net.HttpURLConnection` | Deliberately dependency-free — one fire-and-forget POST doesn't justify Retrofit/OkHttp |
| Build System | Gradle (Kotlin DSL) | Gradle `8.9`, Android Gradle Plugin `8.6.0` |
| Android SDK | `minSdk 24` / `compileSdk 35` / `targetSdk 35` | Java 17 toolchain |

### Web App (`web/`)

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js | `16.3.0`, App Router, React `19.2.8` |
| Language | TypeScript | |
| Styling | Tailwind CSS | `v4` |
| Database | Neon PostgreSQL | Serverless Postgres, accessed via `DATABASE_URL` |
| ORM | Prisma | `6.19.3`, generated client output to `src/generated/prisma` |
| Object Storage | Cloudflare R2 | S3-compatible, via `@aws-sdk/client-s3`; holds product photos only |
| Charts | Recharts | `3.10.1` |
| Icons | lucide-react | |

## Data Model

The web app's Prisma schema (`web/prisma/schema.prisma`) is the single source of truth, persisted in Neon PostgreSQL. Monetary fields are stored as integer **poisha** (1/100 BDT) to avoid floating-point rounding drift.

| Model | Table | Purpose |
|---|---|---|
| `Product` | `Product` | A sellable item: barcode value (unique), name, category, color, variant, buying/selling price, current stock, `imageKey` (R2 object key, or `null`), `archived` flag. |
| `InventoryTransaction` | `InventoryTransaction` | Full audit log of every stock change — `ADD`, `REMOVE`, `ADJUST`, or `SALE` — with the signed quantity delta, the resulting stock level snapshotted on each row, and an optional link back to the `Sale` that caused it. |
| `Sale` | `Sale` | The header of a completed sale: timestamp, payment type (`CASH` / `CARD` / `MOBILE_MONEY` / `OTHER`), total amount, amount paid, amount due, change amount. |
| `SaleItem` | `SaleItem` | The product line within a sale: quantity, plus selling price / buying cost / discount **as they were at the time of sale**, so historical gross-profit figures stay correct even after a product's prices later change. |
| `AppSettings` | `AppSettings` | Single-row shop settings: low-stock threshold, currency symbol. |

## Barcode Scanning → POS Pipeline

```
Phone Camera
     │
     ▼
CameraX (image analysis stream)
     │
     ▼
Google ML Kit Barcode Scanning (on-device decode)
     │
     ▼
BarcodeSender ── POST http://<desktop-ip>:<port>/api/scanner/events
     │              { type: "scan", barcode, format }
     ▼
Desktop web app: in-memory scan event queue (per-server-instance)
     │
     ▼
/sales page polls GET /api/scanner/events?since=<id>
     │
     ▼
Product Lookup ──── not found ────▶ Register New Product
     │ found
     ▼
Add to Cart ──▶ Set quantity / discount ──▶ Checkout
     │
     ▼
Atomic transaction: insert Sale + SaleItem(s), decrement stock,
log SALE inventory transactions
     │
     ▼
Dashboard + Analytics (summaries + chart)
```

Scan events and the connection heartbeat live only in server memory (`web/src/lib/scannerEvents.ts`) — they're transient session signaling, not business data, so a dev-server restart just costs one more heartbeat, not a lost sale.

## Pairing the Scanner with the Desktop

1. Start the web app (see [Getting Started](#getting-started)) and note the LAN IP address and port it's listening on (default port `3000`).
2. On the phone, open **Desktop Connection** in the FUMAK Scanner app and tap **+** to add a profile: a name (e.g. "Shop Counter"), the desktop's IP address, and its port.
3. Select that profile as active. The phone begins sending a periodic heartbeat plus any scanned barcodes to `http://<ip>:<port>/api/scanner/events`.
4. On the desktop, open `/sales` — the scan panel shows a live Connected/Disconnected status and any barcode scanned on the phone appears there for lookup.

> Both devices must be on the same local network. If `next dev` falls back to a port other than 3000 (because something else is already using it), either restart it with `next dev -p 3000` or update the phone's connection profile to match the port actually printed in the terminal — a mismatch shows no error, scans just silently do nothing on `/sales`.

## Local Data Storage

- **Neon PostgreSQL** is the system of record for every product, inventory transaction, sale, and setting — a managed, cloud-hosted Postgres database reached via `DATABASE_URL`.
- **Cloudflare R2** stores product photo bytes only, referenced from `Product.imageKey`; nothing else is stored there.
- The Android app itself is stateless aside from its locally-saved desktop connection profiles — it has no database and does not cache scanned data.
- Scan/heartbeat events are transient, in-memory on the Next.js server, and are not persisted.

## Project Structure

```
app/src/main/kotlin/com/fumak/scanner/
├── scanner/                       # Camera + ML Kit barcode decoding
│   ├── BarcodeScannerEngine.kt
│   ├── MlKitBarcodeScannerEngine.kt
│   ├── BarcodeFormat.kt
│   ├── BarcodeScanResult.kt
│   └── ScannerConfig.kt
│
├── network/
│   └── BarcodeSender.kt          # POSTs scans/heartbeats to the paired desktop
│
├── data/connection/
│   ├── ConnectionProfile.kt      # name, host, port → baseUrl
│   └── ConnectionProfileStore.kt # local persistence of saved desktop profiles
│
├── ui/
│   ├── nav/                      # Route definitions, FumakNavHost (Scanner ⇄ Connections)
│   ├── connection/                # ConnectionSettingsScreen — add/edit/select desktops
│   └── scanner/                   # SendViewModel
│
├── AppContainer.kt                # Hand-rolled dependency container (no DI framework)
├── FumakApplication.kt            # Owns AppContainer for the app's lifetime
└── MainActivity.kt                # Hosts the NavHost; camera/permission logic for the Scanner screen

web/src/
├── app/
│   ├── page.tsx                   # Dashboard
│   ├── products/                  # Product list, detail, and "new product" pages
│   ├── inventory/                 # Stock adjustment + inventory history
│   ├── sales/                     # POS: scan panel, cart, checkout, sale history/detail
│   ├── analytics/                 # Period filters + revenue chart
│   ├── settings/                  # Low-stock threshold, currency symbol
│   └── api/                       # Route handlers: products, inventory, sales, analytics,
│                                   #   dashboard, settings, scanner/events, product images
│
├── components/
│   ├── pos/                       # ScanPanel, CartPanel, CheckoutPanel, SaleReceipt, ...
│   ├── products/                  # ProductForm, ProductImageField
│   ├── charts/                    # RevenueChart (Recharts)
│   ├── layout/                    # AppShell, Sidebar, TopBar
│   └── ui/                        # StatCard, Table, Toast, Badge, ConfirmDialog, ...
│
├── lib/                            # db.ts (Prisma singleton), r2.ts (image storage),
│                                   #   pos.ts (cart reducer + sale math), analytics.ts,
│                                   #   scannerEvents.ts, money.ts, types.ts, ...
│
└── generated/prisma/               # Generated Prisma client (not hand-edited)

web/prisma/
├── schema.prisma                   # Product, InventoryTransaction, Sale, SaleItem, AppSettings
├── migrations/
└── seed.ts
```

## Getting Started

### Web app (`web/`) — required first, the Android app is only useful once this is running

**Prerequisites**: Node.js 20+, a Neon PostgreSQL database, and (optionally) a Cloudflare R2 bucket for product photos.

1. Install dependencies:
   ```bash
   cd web
   npm install
   ```
2. Create `web/.env` with:
   ```bash
   DATABASE_URL=postgresql://...           # Neon connection string

   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_ENDPOINT=...                          # e.g. https://<account-id>.r2.cloudflarestorage.com
   R2_BUCKET_NAME=...
   ```
   The R2 variables are only needed for product photo upload/serving; the rest of the app works without them.
3. Apply Prisma migrations and generate the client:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
4. (Optional) Seed sample data:
   ```bash
   npm run db:seed
   ```
5. Start the dev server, pinned to port 3000 so the Android app's default connection profile matches it:
   ```bash
   npm run dev -- -p 3000
   ```
6. Open `http://localhost:3000` — or `http://<your-lan-ip>:3000` from another device on the same network.

### Android Scanner app (`app/`)

**Prerequisites**: Android Studio (Koala or newer recommended), a JDK 17 toolchain, and either a physical Android device (API 24+) with USB debugging or an emulator — plus the web app already running and reachable on the same Wi-Fi network.

1. Clone the repository:
   ```bash
   git clone https://github.com/Saji-d/fumak-inventory.git
   cd fumak-inventory
   ```
2. Open the project folder in Android Studio and let Gradle sync (it downloads the Gradle 8.9 distribution and dependencies on first sync).
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
6. On first launch, grant the requested **Camera** permission, then follow [Pairing the Scanner with the Desktop](#pairing-the-scanner-with-the-desktop) above.

## Testing

There is no automated test suite yet; verification is manual:

1. **Camera permission** — first launch should prompt for Camera access; denying it should show the in-app permission message instead of crashing.
2. **Pairing** — add a desktop connection profile with the web app's LAN IP/port and confirm `/sales` shows "Connected" within a few seconds (via the heartbeat).
3. **Real barcode scanning** — scan a real product barcode on the phone and confirm it appears in the desktop's scan panel.
4. **Existing product lookup** — scan a barcode already registered in the catalog and confirm it resolves to the correct product.
5. **New product registration** — scan an unrecognized barcode, register a new product from the desktop, and confirm scanning the same barcode again resolves to it.
6. **Inventory changes** — use Add / Remove / Adjust on a product and confirm stock updates and a corresponding entry appears in its transaction history.
7. **POS checkout** — build a multi-item cart with a discount, complete checkout, and confirm the total/change are correct and stock decreases by the sold quantities.
8. **Dashboard & Analytics** — after a sale, confirm it's reflected in the dashboard KPIs and the relevant analytics period, and that switching period/chart-range filters updates the numbers.

## Current Limitations

- **Single shop, single desktop session model** — there is no authentication/user roles; anyone with the app URL on the LAN can operate it.
- **No partial-payment/credit tracking** — a sale can only be completed once the amount paid covers the total; there's no way to record and later collect an outstanding balance.
- **No full accounting system** — no tax handling, no double-entry bookkeeping, no payroll.
- **No barcode generation** — the system only reads barcodes already printed on FUMAK's products.
- **No automated tests** — verification is currently manual.
- **Scan events are ephemeral** — they live in the Next.js server's memory only; a server restart mid-scan just requires one more heartbeat, but no scan history is retained beyond what was turned into a product lookup or sale.
- **LAN-only pairing** — the phone and desktop must be reachable on the same local network; there's no remote/internet pairing path.

## Roadmap

**Currently implemented** (see [Key Features](#key-features) above): Android barcode-scanning remote with desktop pairing, full product/inventory/sales management on the web app, POS cart checkout, dashboard, and period-filtered revenue analytics — backed by Neon PostgreSQL and Cloudflare R2.

**Future ideas** (not implemented — listed for direction only):
- Authentication and user roles
- Supplier management
- Partial-payment / credit (debtor) tracking
- Multi-shop / multi-location support
- Remote (non-LAN) scanner pairing
- More advanced reporting

## Screenshots

No in-app screenshots are currently checked into this repository. This section will be updated once they're available.

## License

This project currently has no explicit license file. All rights are reserved by default until a license is added.

## Author

**Sajidur Rahman Sajid**

- GitHub: [github.com/Saji-d](https://github.com/Saji-d)
- Portfolio: [sajidur.me](https://sajidur.me)
