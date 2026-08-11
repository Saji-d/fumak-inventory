package com.fumak.scanner.data;

import androidx.annotation.NonNull;
import androidx.room.DatabaseConfiguration;
import androidx.room.InvalidationTracker;
import androidx.room.RoomDatabase;
import androidx.room.RoomOpenHelper;
import androidx.room.migration.AutoMigrationSpec;
import androidx.room.migration.Migration;
import androidx.room.util.DBUtil;
import androidx.room.util.TableInfo;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteOpenHelper;
import com.fumak.scanner.data.analytics.AnalyticsDao;
import com.fumak.scanner.data.analytics.AnalyticsDao_Impl;
import com.fumak.scanner.data.inventory.InventoryTransactionDao;
import com.fumak.scanner.data.inventory.InventoryTransactionDao_Impl;
import com.fumak.scanner.data.product.ProductDao;
import com.fumak.scanner.data.product.ProductDao_Impl;
import com.fumak.scanner.data.sales.SaleDao;
import com.fumak.scanner.data.sales.SaleDao_Impl;
import com.fumak.scanner.data.sales.SaleItemDao;
import com.fumak.scanner.data.sales.SaleItemDao_Impl;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.Generated;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class FumakDatabase_Impl extends FumakDatabase {
  private volatile ProductDao _productDao;

  private volatile InventoryTransactionDao _inventoryTransactionDao;

  private volatile SaleDao _saleDao;

  private volatile SaleItemDao _saleItemDao;

  private volatile AnalyticsDao _analyticsDao;

  @Override
  @NonNull
  protected SupportSQLiteOpenHelper createOpenHelper(@NonNull final DatabaseConfiguration config) {
    final SupportSQLiteOpenHelper.Callback _openCallback = new RoomOpenHelper(config, new RoomOpenHelper.Delegate(1) {
      @Override
      public void createAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS `products` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `barcodeValue` TEXT NOT NULL, `barcodeFormat` TEXT NOT NULL, `name` TEXT NOT NULL, `category` TEXT NOT NULL, `color` TEXT, `variant` TEXT, `buyingPricePoisha` INTEGER NOT NULL, `sellingPricePoisha` INTEGER NOT NULL, `currentStock` INTEGER NOT NULL, `createdAt` INTEGER NOT NULL, `updatedAt` INTEGER NOT NULL)");
        db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS `index_products_barcodeValue` ON `products` (`barcodeValue`)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `inventory_transactions` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `productId` INTEGER NOT NULL, `type` TEXT NOT NULL, `quantityDelta` INTEGER NOT NULL, `resultingStock` INTEGER NOT NULL, `reason` TEXT, `saleId` INTEGER, `timestamp` INTEGER NOT NULL, FOREIGN KEY(`productId`) REFERENCES `products`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE , FOREIGN KEY(`saleId`) REFERENCES `sales`(`id`) ON UPDATE NO ACTION ON DELETE SET NULL )");
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_inventory_transactions_productId` ON `inventory_transactions` (`productId`)");
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_inventory_transactions_saleId` ON `inventory_transactions` (`saleId`)");
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_inventory_transactions_timestamp` ON `inventory_transactions` (`timestamp`)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `sales` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `timestamp` INTEGER NOT NULL, `paymentType` TEXT NOT NULL, `totalAmount` INTEGER NOT NULL, `amountPaid` INTEGER NOT NULL, `amountDue` INTEGER NOT NULL, `changeAmount` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `sale_items` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `saleId` INTEGER NOT NULL, `productId` INTEGER NOT NULL, `quantity` INTEGER NOT NULL, `sellingPriceEachPoisha` INTEGER NOT NULL, `buyingCostEachPoisha` INTEGER NOT NULL, `discountPoisha` INTEGER NOT NULL, FOREIGN KEY(`saleId`) REFERENCES `sales`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE , FOREIGN KEY(`productId`) REFERENCES `products`(`id`) ON UPDATE NO ACTION ON DELETE RESTRICT )");
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_sale_items_saleId` ON `sale_items` (`saleId`)");
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_sale_items_productId` ON `sale_items` (`productId`)");
        db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)");
        db.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, 'f4d400cef4851d181ab4d1bdd07eb1bc')");
      }

      @Override
      public void dropAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("DROP TABLE IF EXISTS `products`");
        db.execSQL("DROP TABLE IF EXISTS `inventory_transactions`");
        db.execSQL("DROP TABLE IF EXISTS `sales`");
        db.execSQL("DROP TABLE IF EXISTS `sale_items`");
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onDestructiveMigration(db);
          }
        }
      }

      @Override
      public void onCreate(@NonNull final SupportSQLiteDatabase db) {
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onCreate(db);
          }
        }
      }

      @Override
      public void onOpen(@NonNull final SupportSQLiteDatabase db) {
        mDatabase = db;
        db.execSQL("PRAGMA foreign_keys = ON");
        internalInitInvalidationTracker(db);
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onOpen(db);
          }
        }
      }

      @Override
      public void onPreMigrate(@NonNull final SupportSQLiteDatabase db) {
        DBUtil.dropFtsSyncTriggers(db);
      }

      @Override
      public void onPostMigrate(@NonNull final SupportSQLiteDatabase db) {
      }

      @Override
      @NonNull
      public RoomOpenHelper.ValidationResult onValidateSchema(
          @NonNull final SupportSQLiteDatabase db) {
        final HashMap<String, TableInfo.Column> _columnsProducts = new HashMap<String, TableInfo.Column>(12);
        _columnsProducts.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProducts.put("barcodeValue", new TableInfo.Column("barcodeValue", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProducts.put("barcodeFormat", new TableInfo.Column("barcodeFormat", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProducts.put("name", new TableInfo.Column("name", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProducts.put("category", new TableInfo.Column("category", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProducts.put("color", new TableInfo.Column("color", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProducts.put("variant", new TableInfo.Column("variant", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProducts.put("buyingPricePoisha", new TableInfo.Column("buyingPricePoisha", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProducts.put("sellingPricePoisha", new TableInfo.Column("sellingPricePoisha", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProducts.put("currentStock", new TableInfo.Column("currentStock", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProducts.put("createdAt", new TableInfo.Column("createdAt", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProducts.put("updatedAt", new TableInfo.Column("updatedAt", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysProducts = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesProducts = new HashSet<TableInfo.Index>(1);
        _indicesProducts.add(new TableInfo.Index("index_products_barcodeValue", true, Arrays.asList("barcodeValue"), Arrays.asList("ASC")));
        final TableInfo _infoProducts = new TableInfo("products", _columnsProducts, _foreignKeysProducts, _indicesProducts);
        final TableInfo _existingProducts = TableInfo.read(db, "products");
        if (!_infoProducts.equals(_existingProducts)) {
          return new RoomOpenHelper.ValidationResult(false, "products(com.fumak.scanner.data.product.ProductEntity).\n"
                  + " Expected:\n" + _infoProducts + "\n"
                  + " Found:\n" + _existingProducts);
        }
        final HashMap<String, TableInfo.Column> _columnsInventoryTransactions = new HashMap<String, TableInfo.Column>(8);
        _columnsInventoryTransactions.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryTransactions.put("productId", new TableInfo.Column("productId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryTransactions.put("type", new TableInfo.Column("type", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryTransactions.put("quantityDelta", new TableInfo.Column("quantityDelta", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryTransactions.put("resultingStock", new TableInfo.Column("resultingStock", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryTransactions.put("reason", new TableInfo.Column("reason", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryTransactions.put("saleId", new TableInfo.Column("saleId", "INTEGER", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryTransactions.put("timestamp", new TableInfo.Column("timestamp", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysInventoryTransactions = new HashSet<TableInfo.ForeignKey>(2);
        _foreignKeysInventoryTransactions.add(new TableInfo.ForeignKey("products", "CASCADE", "NO ACTION", Arrays.asList("productId"), Arrays.asList("id")));
        _foreignKeysInventoryTransactions.add(new TableInfo.ForeignKey("sales", "SET NULL", "NO ACTION", Arrays.asList("saleId"), Arrays.asList("id")));
        final HashSet<TableInfo.Index> _indicesInventoryTransactions = new HashSet<TableInfo.Index>(3);
        _indicesInventoryTransactions.add(new TableInfo.Index("index_inventory_transactions_productId", false, Arrays.asList("productId"), Arrays.asList("ASC")));
        _indicesInventoryTransactions.add(new TableInfo.Index("index_inventory_transactions_saleId", false, Arrays.asList("saleId"), Arrays.asList("ASC")));
        _indicesInventoryTransactions.add(new TableInfo.Index("index_inventory_transactions_timestamp", false, Arrays.asList("timestamp"), Arrays.asList("ASC")));
        final TableInfo _infoInventoryTransactions = new TableInfo("inventory_transactions", _columnsInventoryTransactions, _foreignKeysInventoryTransactions, _indicesInventoryTransactions);
        final TableInfo _existingInventoryTransactions = TableInfo.read(db, "inventory_transactions");
        if (!_infoInventoryTransactions.equals(_existingInventoryTransactions)) {
          return new RoomOpenHelper.ValidationResult(false, "inventory_transactions(com.fumak.scanner.data.inventory.InventoryTransactionEntity).\n"
                  + " Expected:\n" + _infoInventoryTransactions + "\n"
                  + " Found:\n" + _existingInventoryTransactions);
        }
        final HashMap<String, TableInfo.Column> _columnsSales = new HashMap<String, TableInfo.Column>(7);
        _columnsSales.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSales.put("timestamp", new TableInfo.Column("timestamp", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSales.put("paymentType", new TableInfo.Column("paymentType", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSales.put("totalAmount", new TableInfo.Column("totalAmount", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSales.put("amountPaid", new TableInfo.Column("amountPaid", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSales.put("amountDue", new TableInfo.Column("amountDue", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSales.put("changeAmount", new TableInfo.Column("changeAmount", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysSales = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesSales = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoSales = new TableInfo("sales", _columnsSales, _foreignKeysSales, _indicesSales);
        final TableInfo _existingSales = TableInfo.read(db, "sales");
        if (!_infoSales.equals(_existingSales)) {
          return new RoomOpenHelper.ValidationResult(false, "sales(com.fumak.scanner.data.sales.SaleEntity).\n"
                  + " Expected:\n" + _infoSales + "\n"
                  + " Found:\n" + _existingSales);
        }
        final HashMap<String, TableInfo.Column> _columnsSaleItems = new HashMap<String, TableInfo.Column>(7);
        _columnsSaleItems.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSaleItems.put("saleId", new TableInfo.Column("saleId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSaleItems.put("productId", new TableInfo.Column("productId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSaleItems.put("quantity", new TableInfo.Column("quantity", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSaleItems.put("sellingPriceEachPoisha", new TableInfo.Column("sellingPriceEachPoisha", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSaleItems.put("buyingCostEachPoisha", new TableInfo.Column("buyingCostEachPoisha", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSaleItems.put("discountPoisha", new TableInfo.Column("discountPoisha", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysSaleItems = new HashSet<TableInfo.ForeignKey>(2);
        _foreignKeysSaleItems.add(new TableInfo.ForeignKey("sales", "CASCADE", "NO ACTION", Arrays.asList("saleId"), Arrays.asList("id")));
        _foreignKeysSaleItems.add(new TableInfo.ForeignKey("products", "RESTRICT", "NO ACTION", Arrays.asList("productId"), Arrays.asList("id")));
        final HashSet<TableInfo.Index> _indicesSaleItems = new HashSet<TableInfo.Index>(2);
        _indicesSaleItems.add(new TableInfo.Index("index_sale_items_saleId", false, Arrays.asList("saleId"), Arrays.asList("ASC")));
        _indicesSaleItems.add(new TableInfo.Index("index_sale_items_productId", false, Arrays.asList("productId"), Arrays.asList("ASC")));
        final TableInfo _infoSaleItems = new TableInfo("sale_items", _columnsSaleItems, _foreignKeysSaleItems, _indicesSaleItems);
        final TableInfo _existingSaleItems = TableInfo.read(db, "sale_items");
        if (!_infoSaleItems.equals(_existingSaleItems)) {
          return new RoomOpenHelper.ValidationResult(false, "sale_items(com.fumak.scanner.data.sales.SaleItemEntity).\n"
                  + " Expected:\n" + _infoSaleItems + "\n"
                  + " Found:\n" + _existingSaleItems);
        }
        return new RoomOpenHelper.ValidationResult(true, null);
      }
    }, "f4d400cef4851d181ab4d1bdd07eb1bc", "e102ae2e9da60faf582bc4ba4892d20e");
    final SupportSQLiteOpenHelper.Configuration _sqliteConfig = SupportSQLiteOpenHelper.Configuration.builder(config.context).name(config.name).callback(_openCallback).build();
    final SupportSQLiteOpenHelper _helper = config.sqliteOpenHelperFactory.create(_sqliteConfig);
    return _helper;
  }

  @Override
  @NonNull
  protected InvalidationTracker createInvalidationTracker() {
    final HashMap<String, String> _shadowTablesMap = new HashMap<String, String>(0);
    final HashMap<String, Set<String>> _viewTables = new HashMap<String, Set<String>>(0);
    return new InvalidationTracker(this, _shadowTablesMap, _viewTables, "products","inventory_transactions","sales","sale_items");
  }

  @Override
  public void clearAllTables() {
    super.assertNotMainThread();
    final SupportSQLiteDatabase _db = super.getOpenHelper().getWritableDatabase();
    final boolean _supportsDeferForeignKeys = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP;
    try {
      if (!_supportsDeferForeignKeys) {
        _db.execSQL("PRAGMA foreign_keys = FALSE");
      }
      super.beginTransaction();
      if (_supportsDeferForeignKeys) {
        _db.execSQL("PRAGMA defer_foreign_keys = TRUE");
      }
      _db.execSQL("DELETE FROM `products`");
      _db.execSQL("DELETE FROM `inventory_transactions`");
      _db.execSQL("DELETE FROM `sales`");
      _db.execSQL("DELETE FROM `sale_items`");
      super.setTransactionSuccessful();
    } finally {
      super.endTransaction();
      if (!_supportsDeferForeignKeys) {
        _db.execSQL("PRAGMA foreign_keys = TRUE");
      }
      _db.query("PRAGMA wal_checkpoint(FULL)").close();
      if (!_db.inTransaction()) {
        _db.execSQL("VACUUM");
      }
    }
  }

  @Override
  @NonNull
  protected Map<Class<?>, List<Class<?>>> getRequiredTypeConverters() {
    final HashMap<Class<?>, List<Class<?>>> _typeConvertersMap = new HashMap<Class<?>, List<Class<?>>>();
    _typeConvertersMap.put(ProductDao.class, ProductDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(InventoryTransactionDao.class, InventoryTransactionDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(SaleDao.class, SaleDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(SaleItemDao.class, SaleItemDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(AnalyticsDao.class, AnalyticsDao_Impl.getRequiredConverters());
    return _typeConvertersMap;
  }

  @Override
  @NonNull
  public Set<Class<? extends AutoMigrationSpec>> getRequiredAutoMigrationSpecs() {
    final HashSet<Class<? extends AutoMigrationSpec>> _autoMigrationSpecsSet = new HashSet<Class<? extends AutoMigrationSpec>>();
    return _autoMigrationSpecsSet;
  }

  @Override
  @NonNull
  public List<Migration> getAutoMigrations(
      @NonNull final Map<Class<? extends AutoMigrationSpec>, AutoMigrationSpec> autoMigrationSpecs) {
    final List<Migration> _autoMigrations = new ArrayList<Migration>();
    return _autoMigrations;
  }

  @Override
  public ProductDao productDao() {
    if (_productDao != null) {
      return _productDao;
    } else {
      synchronized(this) {
        if(_productDao == null) {
          _productDao = new ProductDao_Impl(this);
        }
        return _productDao;
      }
    }
  }

  @Override
  public InventoryTransactionDao inventoryTransactionDao() {
    if (_inventoryTransactionDao != null) {
      return _inventoryTransactionDao;
    } else {
      synchronized(this) {
        if(_inventoryTransactionDao == null) {
          _inventoryTransactionDao = new InventoryTransactionDao_Impl(this);
        }
        return _inventoryTransactionDao;
      }
    }
  }

  @Override
  public SaleDao saleDao() {
    if (_saleDao != null) {
      return _saleDao;
    } else {
      synchronized(this) {
        if(_saleDao == null) {
          _saleDao = new SaleDao_Impl(this);
        }
        return _saleDao;
      }
    }
  }

  @Override
  public SaleItemDao saleItemDao() {
    if (_saleItemDao != null) {
      return _saleItemDao;
    } else {
      synchronized(this) {
        if(_saleItemDao == null) {
          _saleItemDao = new SaleItemDao_Impl(this);
        }
        return _saleItemDao;
      }
    }
  }

  @Override
  public AnalyticsDao analyticsDao() {
    if (_analyticsDao != null) {
      return _analyticsDao;
    } else {
      synchronized(this) {
        if(_analyticsDao == null) {
          _analyticsDao = new AnalyticsDao_Impl(this);
        }
        return _analyticsDao;
      }
    }
  }
}
