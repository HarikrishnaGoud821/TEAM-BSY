package com.teambsy.backend.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class CreatePaymentRequest {

    @NotNull
    @DecimalMin(value = "1.00", message = "Minimum contribution is ₹1")
    @DecimalMax(value = "1000000.00", message = "Maximum contribution is ₹10,00,000")
    @Digits(integer = 7, fraction = 2)
    private BigDecimal amount;

    @NotBlank
    @Pattern(regexp = "RAZORPAY|QR")
    private String method;

    @NotBlank
    @Size(min = 2, max = 100)
    private String donorName;

    @NotBlank
    @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Enter a valid 10-digit mobile number")
    private String donorMobile;

    @Size(max = 150)
    private String purpose;

    @Size(max = 500)
    private String notes;

    @Size(max = 80)
    private String village;

    @Size(max = 80)
    private String mandal;

    @Size(max = 80)
    private String district;

    @Pattern(regexp = "^$|^[0-9]{6}$", message = "Pincode must contain 6 digits")
    private String pincode;

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getDonorName() { return donorName; }
    public void setDonorName(String donorName) { this.donorName = donorName; }

    public String getDonorMobile() { return donorMobile; }
    public void setDonorMobile(String donorMobile) { this.donorMobile = donorMobile; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getVillage() { return village; }
    public void setVillage(String village) { this.village = village; }

    public String getMandal() { return mandal; }
    public void setMandal(String mandal) { this.mandal = mandal; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
}