package com.teambsy.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ContributionResponse {

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

    public ContributionResponse(
            String id,
            Long serialNo,
            String receiptNumber,
            LocalDate donationDate,
            String donorName,
            String donorMobile,
            BigDecimal amount,
            String paymentMethod,
            String paymentStatus,
            String purpose,
            String village,
            String mandal,
            String district,
            String pincode,
            String enteredByName,
            String paymentId
    ) {
        this.id = id;
        this.serial_no = serialNo;
        this.receipt_number = receiptNumber;
        this.donation_date = donationDate;
        this.donor_name = donorName;
        this.donor_mobile = donorMobile;
        this.amount = amount;
        this.payment_method = paymentMethod;
        this.payment_status = paymentStatus;
        this.purpose = purpose;
        this.village = village;
        this.mandal = mandal;
        this.district = district;
        this.pincode = pincode;
        this.entered_by_name = enteredByName;
        this.payment_id = paymentId;
    }
}