
package com.teambsy.backend.entity;

import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "contributions",
    indexes = {
        @Index(name = "idx_contributions_user", columnList = "user_id"),
        @Index(name = "idx_contributions_date", columnList = "donation_date"),
        @Index(name = "idx_contributions_status", columnList = "payment_status")
    }
)
public class Contribution {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Generated(event = EventType.INSERT)
@Column(name = "serial_no", unique = true, insertable = false, updatable = false)
private Long serialNo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(name = "donation_mode", nullable = false, length = 10)
    private String donationMode;

    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod;

    @Column(name = "payment_provider", length = 50)
    private String paymentProvider;

    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = "PENDING";

    @Column(name = "order_id", unique = true, length = 255)
    private String orderId;

    @Column(name = "payment_id", unique = true, length = 255)
    private String paymentId;

    @Column(name = "transaction_id", length = 255)
    private String transactionId;

    @Column(name = "receipt_number", unique = true, length = 50)
    private String receiptNumber;

    @Column(name = "donor_name", nullable = false, length = 150)
    private String donorName;

    @Column(name = "donor_mobile", nullable = false, length = 10)
    private String donorMobile;

    @Column(name = "user_id", length = 36)
    private String userId;

    @Column(length = 100)
    private String village;

    @Column(length = 100)
    private String mandal;

    @Column(length = 100)
    private String district;

    @Column(length = 6)
    private String pincode;

    @Column(length = 150)
    private String purpose;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "donation_date", nullable = false)
    private LocalDate donationDate;

    @Column(name = "entered_by", length = 36)
    private String enteredBy;

    @Column(name = "entered_by_name", length = 150)
    private String enteredByName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Contribution() {
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }

        LocalDateTime now = LocalDateTime.now();

        if (donationDate == null) {
            donationDate = LocalDate.now();
        }

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getSerialNo() { return serialNo; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getDonationMode() { return donationMode; }
    public void setDonationMode(String donationMode) { this.donationMode = donationMode; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentProvider() { return paymentProvider; }
    public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getReceiptNumber() { return receiptNumber; }
    public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }

    public String getDonorName() { return donorName; }
    public void setDonorName(String donorName) { this.donorName = donorName; }

    public String getDonorMobile() { return donorMobile; }
    public void setDonorMobile(String donorMobile) { this.donorMobile = donorMobile; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getVillage() { return village; }
    public void setVillage(String village) { this.village = village; }

    public String getMandal() { return mandal; }
    public void setMandal(String mandal) { this.mandal = mandal; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDate getDonationDate() { return donationDate; }
    public void setDonationDate(LocalDate donationDate) { this.donationDate = donationDate; }

    public String getEnteredBy() { return enteredBy; }
    public void setEnteredBy(String enteredBy) { this.enteredBy = enteredBy; }

    public String getEnteredByName() { return enteredByName; }
    public void setEnteredByName(String enteredByName) { this.enteredByName = enteredByName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
