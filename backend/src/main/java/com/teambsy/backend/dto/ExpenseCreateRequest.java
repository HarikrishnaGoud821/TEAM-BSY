package com.teambsy.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class ExpenseCreateRequest {

    public LocalDate expense_date;
    public String category;
    public String purpose;
    public String description;
    public String notes;

    public String shop_name;
    public String shop_owner;
    public String shop_contact;
    public String shop_address;

    public String village;
    public String mandal;
    public String district;
    public String pincode;

    public String payment_method;
    public String payment_reference;

    public List<ItemRequest> items;

    public static class ItemRequest {
        public String item_name;
        public BigDecimal quantity;
        public BigDecimal unit_price;
    }
}