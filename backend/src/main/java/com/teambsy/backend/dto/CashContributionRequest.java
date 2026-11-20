package com.teambsy.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CashContributionRequest {

    public BigDecimal amount;
    public String donorName;
    public String donorMobile;
    public String purpose;
    public String notes;
    public String village;
    public String mandal;
    public String district;
    public String pincode;
    public LocalDate donationDate;
}
