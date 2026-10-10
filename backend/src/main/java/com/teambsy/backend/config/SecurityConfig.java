
package com.teambsy.backend.config;

import com.teambsy.backend.security.JwtAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .cors(cors -> {})

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // Public endpoints — preserved from your old code
                        .requestMatchers(
                                "/api/health",
                                "/api/auth/**",
                                "/api/upload/photo",
                                "/uploads/**",
                                "/api/payments/**",
                                "/api/contributions"
                        ).permitAll()

                        // Scrolling photos:
                        // All authenticated users can view photos.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/scrolling-photos"
                        ).authenticated()

                        // Only ADMIN can upload scrolling photos.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/scrolling-photos"
                        ).hasRole("ADMIN")

                        // Only ADMIN can delete scrolling photos.
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/scrolling-photos/**"
                        ).hasRole("ADMIN")

                        // Existing admin endpoints — preserved
                        .requestMatchers("/api/admin/**")
                        .hasRole("ADMIN")

                        // Existing role endpoints — preserved
                        .requestMatchers("/api/roles/**")
                        .authenticated()

                        // Everything else — preserved
                        .anyRequest()
                        .authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        // Existing allowed origins — preserved
        configuration.setAllowedOrigins(List.of(
                "http://localhost:8081",
                "http://localhost:8082",
                "http://localhost:19006"
        ));

        // Existing allowed methods — preserved
        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of("*"));

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}
