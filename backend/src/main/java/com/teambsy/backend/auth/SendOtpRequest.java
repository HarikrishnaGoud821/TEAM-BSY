package com.teambsy.backend.auth;

public class SendOtpRequest {

    private String mobileNumber;

    public SendOtpRequest() {
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }
}