package com.fumak.scanner.data.inventory;

import android.database.Cursor;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.fumak.scanner.data.Converters;
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
import kotlin.coroutines.Continuation;
import kotlinx.coroutines.flow.Flow;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class InventoryTransactionDao_Impl implements InventoryTransactionDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<InventoryTransactionEntity> __insertionAdapterOfInventoryTransactionEntity;

  private final Converters __converters = new Converters();

  public InventoryTransactionDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfInventoryTransactionEntity = new EntityInsertionAdapter<InventoryTransactionEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR ABORT INTO `inventory_transactions` (`id`,`productId`,`type`,`quantityDelta`,`resultingStock`,`reason`,`saleId`,`timestamp`) VALUES (nullif(?, 0),?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final InventoryTransactionEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindLong(2, entity.getProductId());
        final String _tmp = __converters.inventoryTransactionTypeToString(entity.getType());
        statement.bindString(3, _tmp);
        statement.bindLong(4, entity.getQuantityDelta());
        statement.bindLong(5, entity.getResultingStock());
        if (entity.getReason() == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.getReason());
        }
        if (entity.getSaleId() == null) {
          statement.bindNull(7);
        } else {
          statement.bindLong(7, entity.getSaleId());
        }
        statement.bindLong(8, entity.getTimestamp());
      }
    };
  }

  @Override
  public Object insert(final InventoryTransactionEntity transaction,
      final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfInventoryTransactionEntity.insertAndReturnId(transaction);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<InventoryTransactionEntity>> observeForProduct(final long productId) {
    final String _sql = "SELECT * FROM inventory_transactions WHERE productId = ? ORDER BY timestamp DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, productId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"inventory_transactions"}, new Callable<List<InventoryTransactionEntity>>() {
      @Override
      @NonNull
      public List<InventoryTransactionEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfProductId = CursorUtil.getColumnIndexOrThrow(_cursor, "productId");
          final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
          final int _cursorIndexOfQuantityDelta = CursorUtil.getColumnIndexOrThrow(_cursor, "quantityDelta");
          final int _cursorIndexOfResultingStock = CursorUtil.getColumnIndexOrThrow(_cursor, "resultingStock");
          final int _cursorIndexOfReason = CursorUtil.getColumnIndexOrThrow(_cursor, "reason");
          final int _cursorIndexOfSaleId = CursorUtil.getColumnIndexOrThrow(_cursor, "saleId");
          final int _cursorIndexOfTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "timestamp");
          final List<InventoryTransactionEntity> _result = new ArrayList<InventoryTransactionEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final InventoryTransactionEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final long _tmpProductId;
            _tmpProductId = _cursor.getLong(_cursorIndexOfProductId);
            final InventoryTransactionType _tmpType;
            final String _tmp;
            _tmp = _cursor.getString(_cursorIndexOfType);
            _tmpType = __converters.stringToInventoryTransactionType(_tmp);
            final int _tmpQuantityDelta;
            _tmpQuantityDelta = _cursor.getInt(_cursorIndexOfQuantityDelta);
            final int _tmpResultingStock;
            _tmpResultingStock = _cursor.getInt(_cursorIndexOfResultingStock);
            final String _tmpReason;
            if (_cursor.isNull(_cursorIndexOfReason)) {
              _tmpReason = null;
            } else {
              _tmpReason = _cursor.getString(_cursorIndexOfReason);
            }
            final Long _tmpSaleId;
            if (_cursor.isNull(_cursorIndexOfSaleId)) {
              _tmpSaleId = null;
            } else {
              _tmpSaleId = _cursor.getLong(_cursorIndexOfSaleId);
            }
            final long _tmpTimestamp;
            _tmpTimestamp = _cursor.getLong(_cursorIndexOfTimestamp);
            _item = new InventoryTransactionEntity(_tmpId,_tmpProductId,_tmpType,_tmpQuantityDelta,_tmpResultingStock,_tmpReason,_tmpSaleId,_tmpTimestamp);
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
