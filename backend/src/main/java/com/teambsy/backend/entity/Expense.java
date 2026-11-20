package com.teambsy.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "expenses", indexes = {
    @Index(name = "idx_expenses_mentor", columnList = "mentor_id"),
    @Index(name = "idx_expenses_date", columnList = "expense_date")
})
public class Expense {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Generated(event = EventType.INSERT)
    @Column(name = "serial_no",
        columnDefinition = "BIGINT NOT NULL AUTO_INCREMENT UNIQUE",
        insertable = false, updatable = false)
    private Long serialNo;

    @Column(name = "mentor_id", nullable = false, length = 36)
    private String mentorId;

    @Column(name = "mentor_name", nullable = false, length = 255)
    private String mentorName;

    @Column(name = "mentor_mobile", length = 20)
    private String mentorMobile;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String purpose;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "shop_name", nullable = false, length = 255)
    private String shopName;

    @Column(name = "shop_owner", length = 255)
    private String shopOwner;

    @Column(name = "shop_contact", length = 30)
    private String shopContact;

    @Column(name = "shop_address", columnDefinition = "TEXT")
    private String shopAddress;

    @Column(length = 100)
    private String village;

    @Column(length = 100)
    private String mandal;

    @Column(length = 100)
    private String district;

    @Column(length = 6)
    private String pincode;

    @Column(name = "payment_method", nullable = false, length = 30)
    private String paymentMethod;

    @Column(name = "payment_reference", length = 255)
    private String paymentReference;

    @Column(name = "receipt_file_key", length = 500)
    private String receiptFileKey;

    @Column(name = "receipt_file_name", length = 255)
    private String receiptFileName;

    @Column(name = "receipt_content_type", length = 100)
    private String receiptContentType;

    @Column(name = "receipt_uploaded_at")
    private LocalDateTime receiptUploadedAt;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "reviewed_by", length = 36)
    private String reviewedBy;

    @Column(name = "reviewed_by_name", length = 255)
    private String reviewedByName;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Expense() {}

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (expenseDate == null) expenseDate = LocalDate.now();
        if (amount == null) amount = BigDecimal.ZERO;
        if (status == null) status = "PENDING";
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public Long getSerialNo() { return serialNo; }
    public String getMentorId() { return mentorId; }
    public void setMentorId(String v) { mentorId = v; }
    public String getMentorName() { return mentorName; }
    public void setMentorName(String v) { mentorName = v; }
    public String getMentorMobile() { return mentorMobile; }
    public void setMentorMobile(String v) { mentorMobile = v; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal v) { amount = v; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate v) { expenseDate = v; }
    public String getCategory() { return category; }
    public void setCategory(String v) { category = v; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String v) { purpose = v; }
    public String getDescription() { return description; }
    public void setDescription(String v) { description = v; }
    public String getNotes() { return notes; }
    public void setNotes(String v) { notes = v; }
    public String getShopName() { return shopName; }
    public void setShopName(String v) { shopName = v; }
    public String getShopOwner() { return shopOwner; }
    public void setShopOwner(String v) { shopOwner = v; }
    public String getShopContact() { return shopContact; }
    public void setShopContact(String v) { shopContact = v; }
    public String getShopAddress() { return shopAddress; }
    public void setShopAddress(String v) { shopAddress = v; }
    public String getVillage() { return village; }
    public void setVillage(String v) { village = v; }
    public String getMandal() { return mandal; }
    public void setMandal(String v) { mandal = v; }
    public String getDistrict() { return district; }
    public void setDistrict(String v) { district = v; }
    public String getPincode() { return pincode; }
    public void setPincode(String v) { pincode = v; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String v) { paymentMethod = v; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String v) { paymentReference = v; }
    public String getReceiptFileKey() { return receiptFileKey; }
    public void setReceiptFileKey(String v) { receiptFileKey = v; }
    public String getReceiptFileName() { return receiptFileName; }
    public void setReceiptFileName(String v) { receiptFileName = v; }
    public String getReceiptContentType() { return receiptContentType; }
    public void setReceiptContentType(String v) { receiptContentType = v; }
    public LocalDateTime getReceiptUploadedAt() { return receiptUploadedAt; }
    public void setReceiptUploadedAt(LocalDateTime v) { receiptUploadedAt = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String v) { rejectionReason = v; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String v) { reviewedBy = v; }
    public String getReviewedByName() { return reviewedByName; }
    public void setReviewedByName(String v) { reviewedByName = v; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime v) { reviewedAt = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
