
package com.teambsy.backend.dto;

import java.util.List;

public record AuthResponse(
        String token,
        String id,
        String email,
        ProfileResponse profile,
        List<String> roles
) {
    public record ProfileResponse(
            String full_name,
            String mobile,
            String village,
            String mandal,
            String district,
            String pincode
    ) {
    }
}
