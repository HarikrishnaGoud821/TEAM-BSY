package com.teambsy.backend.repository;

import com.teambsy.backend.entity.ReceiptCounter;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReceiptCounterRepository extends JpaRepository<ReceiptCounter, String> {

    @Modifying
    @Query(value = "INSERT IGNORE INTO receipt_counters (prefix, counter_value) VALUES (:prefix, 0)", nativeQuery = true)
    int insertIfMissing(@Param("prefix") String prefix);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM ReceiptCounter r WHERE r.prefix = :prefix")
    ReceiptCounter findByPrefixForUpdate(@Param("prefix") String prefix);
}
