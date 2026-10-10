package com.teambsy.backend.auth;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final String TEST_OTP = "123456";

    private final Map<String, String> otpStore =
            new ConcurrentHashMap<>();

    public void sendOtp(String mobileNumber) {

        // Development only.
        // Later this will send a real OTP through an SMS provider.
        otpStore.put(mobileNumber, TEST_OTP);
    }

    public boolean verifyOtp(String mobileNumber, String otp) {

        String storedOtp = otpStore.get(mobileNumber);

        if (storedOtp == null) {
            return false;
        }

        if (!storedOtp.equals(otp)) {
            return false;
        }

        otpStore.remove(mobileNumber);

        return true;
    }
}