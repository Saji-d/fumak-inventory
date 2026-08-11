package com.fumak.scanner.data.sales;

import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.sqlite.db.SupportSQLiteStatement;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Long;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.coroutines.Continuation;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class SaleItemDao_Impl implements SaleItemDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<SaleItemEntity> __insertionAdapterOfSaleItemEntity;

  public SaleItemDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfSaleItemEntity = new EntityInsertionAdapter<SaleItemEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR ABORT INTO `sale_items` (`id`,`saleId`,`productId`,`quantity`,`sellingPriceEachPoisha`,`buyingCostEachPoisha`,`discountPoisha`) VALUES (nullif(?, 0),?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final SaleItemEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindLong(2, entity.getSaleId());
        statement.bindLong(3, entity.getProductId());
        statement.bindLong(4, entity.getQuantity());
        statement.bindLong(5, entity.getSellingPriceEachPoisha());
        statement.bindLong(6, entity.getBuyingCostEachPoisha());
        statement.bindLong(7, entity.getDiscountPoisha());
      }
    };
  }

  @Override
  public Object insert(final SaleItemEntity saleItem,
      final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfSaleItemEntity.insertAndReturnId(saleItem);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
