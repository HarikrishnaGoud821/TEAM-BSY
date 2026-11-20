
package com.teambsy.backend.config;

import com.teambsy.backend.entity.AppUser;
import com.teambsy.backend.repository.AppUserRepository;
import com.teambsy.backend.repository.UserRoleRepository;
import com.teambsy.backend.service.JwtService;

import io.jsonwebtoken.JwtException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AppUserRepository appUserRepository;
    private final UserRoleRepository userRoleRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            AppUserRepository appUserRepository,
            UserRoleRepository userRoleRepository
    ) {
        this.jwtService = jwtService;
        this.appUserRepository = appUserRepository;
        this.userRoleRepository = userRoleRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authorizationHeader =
                request.getHeader("Authorization");

        if (authorizationHeader != null
                && authorizationHeader.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            String token = authorizationHeader.substring(7);

            try {
                String userId = jwtService.extractUserId(token);

                AppUser user = appUserRepository.findById(userId)
                        .orElse(null);

                if (user != null && user.isActive()) {

                    List<SimpleGrantedAuthority> authorities =
                            userRoleRepository.findByUserId(userId)
                                    .stream()
                                    .map(role -> new SimpleGrantedAuthority(
                                            "ROLE_" + role.getRole().name()
                                    ))
                                    .toList();

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userId,
                                    null,
                                    authorities
                            );

                    SecurityContextHolder.getContext()
                            .setAuthentication(authentication);
                }

            } catch (JwtException | IllegalArgumentException exception) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
