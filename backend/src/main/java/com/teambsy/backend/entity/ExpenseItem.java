package com.teambsy.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "expense_items",
    indexes = @Index(name = "idx_expense_items_exp", columnList = "expense_id"))
public class ExpenseItem {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "expense_id", nullable = false, length = 36)
    private String expenseId;

    @Column(name = "item_name", nullable = false, columnDefinition = "TEXT")
    private String itemName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(name = "total_price", insertable = false, updatable = false,
        columnDefinition = "DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED")
    private BigDecimal totalPrice;

    public ExpenseItem() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (quantity == null) quantity = BigDecimal.ONE;
    }

    public String getId() { return id; }
    public String getExpenseId() { return expenseId; }
    public void setExpenseId(String v) { expenseId = v; }
    public String getItemName() { return itemName; }
    public void setItemName(String v) { itemName = v; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal v) { quantity = v; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal v) { unitPrice = v; }
    public BigDecimal getTotalPrice() { return totalPrice; }
}
