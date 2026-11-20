package com.teambsy.backend.repository;

import com.teambsy.backend.entity.ExpenseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseItemRepository extends JpaRepository<ExpenseItem, String> {
    List<ExpenseItem> findByExpenseIdOrderByIdAsc(String expenseId);
}