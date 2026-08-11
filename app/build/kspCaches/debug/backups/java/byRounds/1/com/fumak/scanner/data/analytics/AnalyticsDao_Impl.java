package com.fumak.scanner.data.analytics;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.util.DBUtil;
import java.lang.Class;
import java.lang.Exception;
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

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class AnalyticsDao_Impl implements AnalyticsDao {
  private final RoomDatabase __db;

  public AnalyticsDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
  }

  @Override
  public Object getRevenueSummary(final long startMillis, final long endMillis,
      final Continuation<? super RevenueSummary> $completion) {
    final String _sql = "\n"
            + "        SELECT\n"
            + "          COALESCE(SUM(si.sellingPriceEachPoisha * si.quantity - si.discountPoisha), 0) AS totalRevenue,\n"
            + "          COALESCE(SUM(si.quantity), 0) AS totalItemsSold,\n"
            + "          COALESCE(SUM(si.buyingCostEachPoisha * si.quantity), 0) AS totalBuyingCost,\n"
            + "          COALESCE(SUM(si.discountPoisha), 0) AS totalDiscount,\n"
            + "          COALESCE((SELECT SUM(amountPaid) FROM sales WHERE timestamp BETWEEN ? AND ?), 0) AS totalAmountPaid,\n"
            + "          COALESCE((SELECT SUM(amountDue) FROM sales WHERE timestamp BETWEEN ? AND ?), 0) AS totalAmountDue\n"
            + "        FROM sale_items si\n"
            + "        JOIN sales s ON s.id = si.saleId\n"
            + "        WHERE s.timestamp BETWEEN ? AND ?\n"
            + "        ";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 6);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, startMillis);
    _argIndex = 2;
    _statement.bindLong(_argIndex, endMillis);
    _argIndex = 3;
    _statement.bindLong(_argIndex, startMillis);
    _argIndex = 4;
    _statement.bindLong(_argIndex, endMillis);
    _argIndex = 5;
    _statement.bindLong(_argIndex, startMillis);
    _argIndex = 6;
    _statement.bindLong(_argIndex, endMillis);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<RevenueSummary>() {
      @Override
      @NonNull
      public RevenueSummary call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfTotalRevenue = 0;
          final int _cursorIndexOfTotalItemsSold = 1;
          final int _cursorIndexOfTotalBuyingCost = 2;
          final int _cursorIndexOfTotalDiscount = 3;
          final int _cursorIndexOfTotalAmountPaid = 4;
          final int _cursorIndexOfTotalAmountDue = 5;
          final RevenueSummary _result;
          if (_cursor.moveToFirst()) {
            final long _tmpTotalRevenue;
            _tmpTotalRevenue = _cursor.getLong(_cursorIndexOfTotalRevenue);
            final int _tmpTotalItemsSold;
            _tmpTotalItemsSold = _cursor.getInt(_cursorIndexOfTotalItemsSold);
            final long _tmpTotalBuyingCost;
            _tmpTotalBuyingCost = _cursor.getLong(_cursorIndexOfTotalBuyingCost);
            final long _tmpTotalDiscount;
            _tmpTotalDiscount = _cursor.getLong(_cursorIndexOfTotalDiscount);
            final long _tmpTotalAmountPaid;
            _tmpTotalAmountPaid = _cursor.getLong(_cursorIndexOfTotalAmountPaid);
            final long _tmpTotalAmountDue;
            _tmpTotalAmountDue = _cursor.getLong(_cursorIndexOfTotalAmountDue);
            _result = new RevenueSummary(_tmpTotalRevenue,_tmpTotalItemsSold,_tmpTotalBuyingCost,_tmpTotalDiscount,_tmpTotalAmountPaid,_tmpTotalAmountDue);
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
  public Object getRevenuePoints(final long startMillis, final long endMillis,
      final Continuation<? super List<RevenuePointRow>> $completion) {
    final String _sql = "\n"
            + "        SELECT s.timestamp AS timestamp, (si.sellingPriceEachPoisha * si.quantity - si.discountPoisha) AS amount\n"
            + "        FROM sale_items si\n"
            + "        JOIN sales s ON s.id = si.saleId\n"
            + "        WHERE s.timestamp BETWEEN ? AND ?\n"
            + "        ORDER BY s.timestamp ASC\n"
            + "        ";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 2);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, startMillis);
    _argIndex = 2;
    _statement.bindLong(_argIndex, endMillis);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<RevenuePointRow>>() {
      @Override
      @NonNull
      public List<RevenuePointRow> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfTimestamp = 0;
          final int _cursorIndexOfAmount = 1;
          final List<RevenuePointRow> _result = new ArrayList<RevenuePointRow>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final RevenuePointRow _item;
            final long _tmpTimestamp;
            _tmpTimestamp = _cursor.getLong(_cursorIndexOfTimestamp);
            final long _tmpAmount;
            _tmpAmount = _cursor.getLong(_cursorIndexOfAmount);
            _item = new RevenuePointRow(_tmpTimestamp,_tmpAmount);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
