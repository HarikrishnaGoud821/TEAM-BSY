package com.teambsy.backend.repository;

import com.teambsy.backend.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, String> {
    List<Expense> findAllByOrderByCreatedAtDesc();
    List<Expense> findByMentorIdOrderByCreatedAtDesc(String mentorId);
}