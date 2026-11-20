
package com.teambsy.backend.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey signingKey;

    private final long expirationTime = 86400000; // 24 hours

    public JwtService(@Value("${JWT_SECRET}") String secret) {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String userId, String email) {

        Date now = new Date();
        Date expiration = new Date(now.getTime() + expirationTime);

        return Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(signingKey)
                .compact();
    }

    public String extractUserId(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, String expectedUserId) {
        Claims claims = extractAllClaims(token);

        return claims.getSubject().equals(expectedUserId)
                && claims.getExpiration().after(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
