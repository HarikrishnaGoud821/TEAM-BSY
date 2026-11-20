package com.teambsy.backend.dto;

import java.math.BigDecimal;

public class ExpenseItemResponse {
    public String id;
    public String expense_id;
    public String item_name;
    public BigDecimal quantity;
    public BigDecimal unit_price;
    public BigDecimal total_price;

    public ExpenseItemResponse(
            String id,
            String expenseId,
            String itemName,
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal totalPrice
    ) {
        this.id = id;
        this.expense_id = expenseId;
        this.item_name = itemName;
        this.quantity = quantity;
        this.unit_price = unitPrice;
        this.total_price = totalPrice;
    }
}