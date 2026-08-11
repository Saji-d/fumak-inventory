package com.fumak.scanner.data.product;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityDeletionOrUpdateAdapter;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.fumak.scanner.data.Converters;
import com.fumak.scanner.scanner.BarcodeFormat;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Long;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;
import kotlinx.coroutines.flow.Flow;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class ProductDao_Impl implements ProductDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<ProductEntity> __insertionAdapterOfProductEntity;

  private final Converters __converters = new Converters();

  private final EntityDeletionOrUpdateAdapter<ProductEntity> __updateAdapterOfProductEntity;

  public ProductDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfProductEntity = new EntityInsertionAdapter<ProductEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR ABORT INTO `products` (`id`,`barcodeValue`,`barcodeFormat`,`name`,`category`,`color`,`variant`,`buyingPricePoisha`,`sellingPricePoisha`,`currentStock`,`createdAt`,`updatedAt`) VALUES (nullif(?, 0),?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ProductEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getBarcodeValue());
        final String _tmp = __converters.barcodeFormatToString(entity.getBarcodeFormat());
        statement.bindString(3, _tmp);
        statement.bindString(4, entity.getName());
        statement.bindString(5, entity.getCategory());
        if (entity.getColor() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getColor());
        }
        if (entity.getVariant() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getVariant());
        }
        statement.bindLong(8, entity.getBuyingPricePoisha());
        statement.bindLong(9, entity.getSellingPricePoisha());
        statement.bindLong(10, entity.getCurrentStock());
        statement.bindLong(11, entity.getCreatedAt());
        statement.bindLong(12, entity.getUpdatedAt());
      }
    };
    this.__updateAdapterOfProductEntity = new EntityDeletionOrUpdateAdapter<ProductEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `products` SET `id` = ?,`barcodeValue` = ?,`barcodeFormat` = ?,`name` = ?,`category` = ?,`color` = ?,`variant` = ?,`buyingPricePoisha` = ?,`sellingPricePoisha` = ?,`currentStock` = ?,`createdAt` = ?,`updatedAt` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ProductEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getBarcodeValue());
        final String _tmp = __converters.barcodeFormatToString(entity.getBarcodeFormat());
        statement.bindString(3, _tmp);
        statement.bindString(4, entity.getName());
        statement.bindString(5, entity.getCategory());
        if (entity.getColor() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getColor());
        }
        if (entity.getVariant() == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.getVariant());
        }
        statement.bindLong(8, entity.getBuyingPricePoisha());
        statement.bindLong(9, entity.getSellingPricePoisha());
        statement.bindLong(10, entity.getCurrentStock());
        statement.bindLong(11, entity.getCreatedAt());
        statement.bindLong(12, entity.getUpdatedAt());
        statement.bindLong(13, entity.getId());
      }
    };
  }

  @Override
  public Object insert(final ProductEntity product, final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfProductEntity.insertAndReturnId(product);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object update(final ProductEntity product, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfProductEntity.handle(product);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object findByBarcode(final String barcodeValue,
      final Continuation<? super ProductEntity> $completion) {
    final String _sql = "SELECT * FROM products WHERE barcodeValue = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, barcodeValue);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<ProductEntity>() {
      @Override
      @Nullable
      public ProductEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfBarcodeValue = CursorUtil.getColumnIndexOrThrow(_cursor, "barcodeValue");
          final int _cursorIndexOfBarcodeFormat = CursorUtil.getColumnIndexOrThrow(_cursor, "barcodeFormat");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfCategory = CursorUtil.getColumnIndexOrThrow(_cursor, "category");
          final int _cursorIndexOfColor = CursorUtil.getColumnIndexOrThrow(_cursor, "color");
          final int _cursorIndexOfVariant = CursorUtil.getColumnIndexOrThrow(_cursor, "variant");
          final int _cursorIndexOfBuyingPricePoisha = CursorUtil.getColumnIndexOrThrow(_cursor, "buyingPricePoisha");
          final int _cursorIndexOfSellingPricePoisha = CursorUtil.getColumnIndexOrThrow(_cursor, "sellingPricePoisha");
          final int _cursorIndexOfCurrentStock = CursorUtil.getColumnIndexOrThrow(_cursor, "currentStock");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final ProductEntity _result;
          if (_cursor.moveToFirst()) {
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpBarcodeValue;
            _tmpBarcodeValue = _cursor.getString(_cursorIndexOfBarcodeValue);
            final BarcodeFormat _tmpBarcodeFormat;
            final String _tmp;
            _tmp = _cursor.getString(_cursorIndexOfBarcodeFormat);
            _tmpBarcodeFormat = __converters.stringToBarcodeFormat(_tmp);
            final String _tmpName;
            _tmpName = _cursor.getString(_cursorIndexOfName);
            final String _tmpCategory;
            _tmpCategory = _cursor.getString(_cursorIndexOfCategory);
            final String _tmpColor;
            if (_cursor.isNull(_cursorIndexOfColor)) {
              _tmpColor = null;
            } else {
              _tmpColor = _cursor.getString(_cursorIndexOfColor);
            }
            final String _tmpVariant;
            if (_cursor.isNull(_cursorIndexOfVariant)) {
              _tmpVariant = null;
            } else {
              _tmpVariant = _cursor.getString(_cursorIndexOfVariant);
            }
            final long _tmpBuyingPricePoisha;
            _tmpBuyingPricePoisha = _cursor.getLong(_cursorIndexOfBuyingPricePoisha);
            final long _tmpSellingPricePoisha;
            _tmpSellingPricePoisha = _cursor.getLong(_cursorIndexOfSellingPricePoisha);
            final int _tmpCurrentStock;
            _tmpCurrentStock = _cursor.getInt(_cursorIndexOfCurrentStock);
            final long _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
            final long _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getLong(_cursorIndexOfUpdatedAt);
            _result = new ProductEntity(_tmpId,_tmpBarcodeValue,_tmpBarcodeFormat,_tmpName,_tmpCategory,_tmpColor,_tmpVariant,_tmpBuyingPricePoisha,_tmpSellingPricePoisha,_tmpCurrentStock,_tmpCreatedAt,_tmpUpdatedAt);
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getById(final long id, final Continuation<? super ProductEntity> $completion) {
    final String _sql = "SELECT * FROM products WHERE id = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<ProductEntity>() {
      @Override
      @Nullable
      public ProductEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfBarcodeValue = CursorUtil.getColumnIndexOrThrow(_cursor, "barcodeValue");
          final int _cursorIndexOfBarcodeFormat = CursorUtil.getColumnIndexOrThrow(_cursor, "barcodeFormat");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfCategory = CursorUtil.getColumnIndexOrThrow(_cursor, "category");
          final int _cursorIndexOfColor = CursorUtil.getColumnIndexOrThrow(_cursor, "color");
          final int _cursorIndexOfVariant = CursorUtil.getColumnIndexOrThrow(_cursor, "variant");
          final int _cursorIndexOfBuyingPricePoisha = CursorUtil.getColumnIndexOrThrow(_cursor, "buyingPricePoisha");
          final int _cursorIndexOfSellingPricePoisha = CursorUtil.getColumnIndexOrThrow(_cursor, "sellingPricePoisha");
          final int _cursorIndexOfCurrentStock = CursorUtil.getColumnIndexOrThrow(_cursor, "currentStock");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final ProductEntity _result;
          if (_cursor.moveToFirst()) {
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpBarcodeValue;
            _tmpBarcodeValue = _cursor.getString(_cursorIndexOfBarcodeValue);
            final BarcodeFormat _tmpBarcodeFormat;
            final String _tmp;
            _tmp = _cursor.getString(_cursorIndexOfBarcodeFormat);
            _tmpBarcodeFormat = __converters.stringToBarcodeFormat(_tmp);
            final String _tmpName;
            _tmpName = _cursor.getString(_cursorIndexOfName);
            final String _tmpCategory;
            _tmpCategory = _cursor.getString(_cursorIndexOfCategory);
            final String _tmpColor;
            if (_cursor.isNull(_cursorIndexOfColor)) {
              _tmpColor = null;
            } else {
              _tmpColor = _cursor.getString(_cursorIndexOfColor);
            }
            final String _tmpVariant;
            if (_cursor.isNull(_cursorIndexOfVariant)) {
              _tmpVariant = null;
            } else {
              _tmpVariant = _cursor.getString(_cursorIndexOfVariant);
            }
            final long _tmpBuyingPricePoisha;
            _tmpBuyingPricePoisha = _cursor.getLong(_cursorIndexOfBuyingPricePoisha);
            final long _tmpSellingPricePoisha;
            _tmpSellingPricePoisha = _cursor.getLong(_cursorIndexOfSellingPricePoisha);
            final int _tmpCurrentStock;
            _tmpCurrentStock = _cursor.getInt(_cursorIndexOfCurrentStock);
            final long _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
            final long _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getLong(_cursorIndexOfUpdatedAt);
            _result = new ProductEntity(_tmpId,_tmpBarcodeValue,_tmpBarcodeFormat,_tmpName,_tmpCategory,_tmpColor,_tmpVariant,_tmpBuyingPricePoisha,_tmpSellingPricePoisha,_tmpCurrentStock,_tmpCreatedAt,_tmpUpdatedAt);
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Flow<ProductEntity> observeById(final long id) {
    final String _sql = "SELECT * FROM products WHERE id = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, id);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"products"}, new Callable<ProductEntity>() {
      @Override
      @Nullable
      public ProductEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfBarcodeValue = CursorUtil.getColumnIndexOrThrow(_cursor, "barcodeValue");
          final int _cursorIndexOfBarcodeFormat = CursorUtil.getColumnIndexOrThrow(_cursor, "barcodeFormat");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfCategory = CursorUtil.getColumnIndexOrThrow(_cursor, "category");
          final int _cursorIndexOfColor = CursorUtil.getColumnIndexOrThrow(_cursor, "color");
          final int _cursorIndexOfVariant = CursorUtil.getColumnIndexOrThrow(_cursor, "variant");
          final int _cursorIndexOfBuyingPricePoisha = CursorUtil.getColumnIndexOrThrow(_cursor, "buyingPricePoisha");
          final int _cursorIndexOfSellingPricePoisha = CursorUtil.getColumnIndexOrThrow(_cursor, "sellingPricePoisha");
          final int _cursorIndexOfCurrentStock = CursorUtil.getColumnIndexOrThrow(_cursor, "currentStock");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final ProductEntity _result;
          if (_cursor.moveToFirst()) {
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpBarcodeValue;
            _tmpBarcodeValue = _cursor.getString(_cursorIndexOfBarcodeValue);
            final BarcodeFormat _tmpBarcodeFormat;
            final String _tmp;
            _tmp = _cursor.getString(_cursorIndexOfBarcodeFormat);
            _tmpBarcodeFormat = __converters.stringToBarcodeFormat(_tmp);
            final String _tmpName;
            _tmpName = _cursor.getString(_cursorIndexOfName);
            final String _tmpCategory;
            _tmpCategory = _cursor.getString(_cursorIndexOfCategory);
            final String _tmpColor;
            if (_cursor.isNull(_cursorIndexOfColor)) {
              _tmpColor = null;
            } else {
              _tmpColor = _cursor.getString(_cursorIndexOfColor);
            }
            final String _tmpVariant;
            if (_cursor.isNull(_cursorIndexOfVariant)) {
              _tmpVariant = null;
            } else {
              _tmpVariant = _cursor.getString(_cursorIndexOfVariant);
            }
            final long _tmpBuyingPricePoisha;
            _tmpBuyingPricePoisha = _cursor.getLong(_cursorIndexOfBuyingPricePoisha);
            final long _tmpSellingPricePoisha;
            _tmpSellingPricePoisha = _cursor.getLong(_cursorIndexOfSellingPricePoisha);
            final int _tmpCurrentStock;
            _tmpCurrentStock = _cursor.getInt(_cursorIndexOfCurrentStock);
            final long _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
            final long _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getLong(_cursorIndexOfUpdatedAt);
            _result = new ProductEntity(_tmpId,_tmpBarcodeValue,_tmpBarcodeFormat,_tmpName,_tmpCategory,_tmpColor,_tmpVariant,_tmpBuyingPricePoisha,_tmpSellingPricePoisha,_tmpCurrentStock,_tmpCreatedAt,_tmpUpdatedAt);
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public Flow<List<ProductEntity>> observeAll() {
    final String _sql = "SELECT * FROM products ORDER BY name ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"products"}, new Callable<List<ProductEntity>>() {
      @Override
      @NonNull
      public List<ProductEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfBarcodeValue = CursorUtil.getColumnIndexOrThrow(_cursor, "barcodeValue");
          final int _cursorIndexOfBarcodeFormat = CursorUtil.getColumnIndexOrThrow(_cursor, "barcodeFormat");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfCategory = CursorUtil.getColumnIndexOrThrow(_cursor, "category");
          final int _cursorIndexOfColor = CursorUtil.getColumnIndexOrThrow(_cursor, "color");
          final int _cursorIndexOfVariant = CursorUtil.getColumnIndexOrThrow(_cursor, "variant");
          final int _cursorIndexOfBuyingPricePoisha = CursorUtil.getColumnIndexOrThrow(_cursor, "buyingPricePoisha");
          final int _cursorIndexOfSellingPricePoisha = CursorUtil.getColumnIndexOrThrow(_cursor, "sellingPricePoisha");
          final int _cursorIndexOfCurrentStock = CursorUtil.getColumnIndexOrThrow(_cursor, "currentStock");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<ProductEntity> _result = new ArrayList<ProductEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ProductEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpBarcodeValue;
            _tmpBarcodeValue = _cursor.getString(_cursorIndexOfBarcodeValue);
            final BarcodeFormat _tmpBarcodeFormat;
            final String _tmp;
            _tmp = _cursor.getString(_cursorIndexOfBarcodeFormat);
            _tmpBarcodeFormat = __converters.stringToBarcodeFormat(_tmp);
            final String _tmpName;
            _tmpName = _cursor.getString(_cursorIndexOfName);
            final String _tmpCategory;
            _tmpCategory = _cursor.getString(_cursorIndexOfCategory);
            final String _tmpColor;
            if (_cursor.isNull(_cursorIndexOfColor)) {
              _tmpColor = null;
            } else {
              _tmpColor = _cursor.getString(_cursorIndexOfColor);
            }
            final String _tmpVariant;
            if (_cursor.isNull(_cursorIndexOfVariant)) {
              _tmpVariant = null;
            } else {
              _tmpVariant = _cursor.getString(_cursorIndexOfVariant);
            }
            final long _tmpBuyingPricePoisha;
            _tmpBuyingPricePoisha = _cursor.getLong(_cursorIndexOfBuyingPricePoisha);
            final long _tmpSellingPricePoisha;
            _tmpSellingPricePoisha = _cursor.getLong(_cursorIndexOfSellingPricePoisha);
            final int _tmpCurrentStock;
            _tmpCurrentStock = _cursor.getInt(_cursorIndexOfCurrentStock);
            final long _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
            final long _tmpUpdatedAt;
            _tmpUpdatedAt = _cursor.getLong(_cursorIndexOfUpdatedAt);
            _item = new ProductEntity(_tmpId,_tmpBarcodeValue,_tmpBarcodeFormat,_tmpName,_tmpCategory,_tmpColor,_tmpVariant,_tmpBuyingPricePoisha,_tmpSellingPricePoisha,_tmpCurrentStock,_tmpCreatedAt,_tmpUpdatedAt);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
