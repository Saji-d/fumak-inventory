package com.fumak.scanner.data.sales;

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
public final class SaleDao_Impl implements SaleDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<SaleEntity> __insertionAdapterOfSaleEntity;

  private final Converters __converters = new Converters();

  public SaleDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfSaleEntity = new EntityInsertionAdapter<SaleEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR ABORT INTO `sales` (`id`,`timestamp`,`paymentType`,`totalAmount`,`amountPaid`,`amountDue`,`changeAmount`) VALUES (nullif(?, 0),?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final SaleEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindLong(2, entity.getTimestamp());
        final String _tmp = __converters.paymentTypeToString(entity.getPaymentType());
        statement.bindString(3, _tmp);
        statement.bindLong(4, entity.getTotalAmount());
        statement.bindLong(5, entity.getAmountPaid());
        statement.bindLong(6, entity.getAmountDue());
        statement.bindLong(7, entity.getChangeAmount());
      }
    };
  }

  @Override
  public Object insert(final SaleEntity sale, final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfSaleEntity.insertAndReturnId(sale);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<SaleEntity>> observeAll() {
    final String _sql = "SELECT * FROM sales ORDER BY timestamp DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"sales"}, new Callable<List<SaleEntity>>() {
      @Override
      @NonNull
      public List<SaleEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "timestamp");
          final int _cursorIndexOfPaymentType = CursorUtil.getColumnIndexOrThrow(_cursor, "paymentType");
          final int _cursorIndexOfTotalAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "totalAmount");
          final int _cursorIndexOfAmountPaid = CursorUtil.getColumnIndexOrThrow(_cursor, "amountPaid");
          final int _cursorIndexOfAmountDue = CursorUtil.getColumnIndexOrThrow(_cursor, "amountDue");
          final int _cursorIndexOfChangeAmount = CursorUtil.getColumnIndexOrThrow(_cursor, "changeAmount");
          final List<SaleEntity> _result = new ArrayList<SaleEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final SaleEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final long _tmpTimestamp;
            _tmpTimestamp = _cursor.getLong(_cursorIndexOfTimestamp);
            final PaymentType _tmpPaymentType;
            final String _tmp;
            _tmp = _cursor.getString(_cursorIndexOfPaymentType);
            _tmpPaymentType = __converters.stringToPaymentType(_tmp);
            final long _tmpTotalAmount;
            _tmpTotalAmount = _cursor.getLong(_cursorIndexOfTotalAmount);
            final long _tmpAmountPaid;
            _tmpAmountPaid = _cursor.getLong(_cursorIndexOfAmountPaid);
            final long _tmpAmountDue;
            _tmpAmountDue = _cursor.getLong(_cursorIndexOfAmountDue);
            final long _tmpChangeAmount;
            _tmpChangeAmount = _cursor.getLong(_cursorIndexOfChangeAmount);
            _item = new SaleEntity(_tmpId,_tmpTimestamp,_tmpPaymentType,_tmpTotalAmount,_tmpAmountPaid,_tmpAmountDue,_tmpChangeAmount);
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
