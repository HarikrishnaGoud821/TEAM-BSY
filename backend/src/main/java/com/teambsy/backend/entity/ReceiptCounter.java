package com.teambsy.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "receipt_counters")
public class ReceiptCounter {

    @Id
    @Column(name = "prefix", length = 20)
    private String prefix;

    @Column(name = "counter_value", nullable = false)
    private Long lastValue = 0L;

    public ReceiptCounter() {
    }

    public ReceiptCounter(String prefix, Long lastValue) {
        this.prefix = prefix;
        this.lastValue = lastValue;
    }

    public String getPrefix() {
        return prefix;
    }

    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }

    public Long getLastValue() {
        return lastValue;
    }

    public void setLastValue(Long lastValue) {
        this.lastValue = lastValue;
    }
}
