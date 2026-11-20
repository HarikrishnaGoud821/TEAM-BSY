
package com.teambsy.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 150, message = "Full name must contain 2 to 150 characters")
    private String fullName;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9][0-9]{9}$",
             message = "Enter a valid 10-digit mobile number")
    private String mobile;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72,
          message = "Password must contain 8 to 72 characters")
    private String password;

    public RegisterRequest() {
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
