package com.teambsy.backend.dto;

import com.teambsy.backend.entity.Contribution;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ReceiptResponse {
    public String id;
    public Long serial_no;
    public String receipt_number;
    public LocalDate donation_date;
    public String donor_name;
    public String donor_mobile;
    public BigDecimal amount;
    public String payment_method;
    public String payment_status;
    public String purpose;
    public String village;
    public String mandal;
    public String district;
    public String pincode;
    public String entered_by_name;
    public String payment_id;
    public String order_id;
    public LocalDateTime updated_at;

    public ReceiptResponse(Contribution c) {
        this.id = c.getId();
        this.serial_no = c.getSerialNo();
        this.receipt_number = c.getReceiptNumber();
        this.donation_date = c.getDonationDate();
        this.donor_name = c.getDonorName();
        this.donor_mobile = c.getDonorMobile();
        this.amount = c.getAmount();
        this.payment_method = c.getPaymentMethod();
        this.payment_status = c.getPaymentStatus();
        this.purpose = c.getPurpose();
        this.village = c.getVillage();
        this.mandal = c.getMandal();
        this.district = c.getDistrict();
        this.pincode = c.getPincode();
        this.entered_by_name = c.getEnteredByName();
        this.payment_id = c.getPaymentId();
        this.order_id = c.getOrderId();
        this.updated_at = c.getUpdatedAt();
    }
}