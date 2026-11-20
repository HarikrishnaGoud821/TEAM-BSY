package com.teambsy.backend.dto;

import com.teambsy.backend.entity.Expense;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ExpenseResponse {
    public String id;
    public Long serial_no;
    public String mentor_id;
    public String mentor_name;
    public String mentor_mobile;
    public BigDecimal amount;
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
    public String receipt_file_name;
    public String receipt_content_type;
    public LocalDateTime receipt_uploaded_at;
    public String status;
    public String rejection_reason;
    public String reviewed_by;
    public String reviewed_by_name;
    public LocalDateTime reviewed_at;
    public LocalDateTime created_at;
    public LocalDateTime updated_at;
    public List<ExpenseItemResponse> items;

    public ExpenseResponse(
            Expense e,
            List<ExpenseItemResponse> items
    ) {
        this.id = e.getId();
        this.serial_no = e.getSerialNo();
        this.mentor_id = e.getMentorId();
        this.mentor_name = e.getMentorName();
        this.mentor_mobile = e.getMentorMobile();
        this.amount = e.getAmount();
        this.expense_date = e.getExpenseDate();
        this.category = e.getCategory();
        this.purpose = e.getPurpose();
        this.description = e.getDescription();
        this.notes = e.getNotes();
        this.shop_name = e.getShopName();
        this.shop_owner = e.getShopOwner();
        this.shop_contact = e.getShopContact();
        this.shop_address = e.getShopAddress();
        this.village = e.getVillage();
        this.mandal = e.getMandal();
        this.district = e.getDistrict();
        this.pincode = e.getPincode();
        this.payment_method = e.getPaymentMethod();
        this.payment_reference = e.getPaymentReference();
        this.receipt_file_name = e.getReceiptFileName();
        this.receipt_content_type = e.getReceiptContentType();
        this.receipt_uploaded_at = e.getReceiptUploadedAt();
        this.status = e.getStatus();
        this.rejection_reason = e.getRejectionReason();
        this.reviewed_by = e.getReviewedBy();
        this.reviewed_by_name = e.getReviewedByName();
        this.reviewed_at = e.getReviewedAt();
        this.created_at = e.getCreatedAt();
        this.updated_at = e.getUpdatedAt();
        this.items = items;
    }
}