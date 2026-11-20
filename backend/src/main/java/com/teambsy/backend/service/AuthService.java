
package com.teambsy.backend.service;

import com.teambsy.backend.dto.AuthResponse;
import com.teambsy.backend.dto.LoginRequest;
import com.teambsy.backend.dto.RegisterRequest;
import com.teambsy.backend.entity.AppRole;
import com.teambsy.backend.entity.AppUser;
import com.teambsy.backend.entity.Profile;
import com.teambsy.backend.entity.UserRole;
import com.teambsy.backend.repository.AppUserRepository;
import com.teambsy.backend.repository.ProfileRepository;
import com.teambsy.backend.repository.UserRoleRepository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Locale;

@Service
public class AuthService {

    private static final String REGISTRATION_LOCK =
            "team_bsy_registration";

    private final AppUserRepository appUserRepository;
    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JdbcTemplate jdbcTemplate;

    public AuthService(
            AppUserRepository appUserRepository,
            ProfileRepository profileRepository,
            UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JdbcTemplate jdbcTemplate
    ) {
        this.appUserRepository = appUserRepository;
        this.profileRepository = profileRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        // Acquire a MySQL lock to protect first-user assignment.
        Integer lockResult = jdbcTemplate.queryForObject(
                "SELECT GET_LOCK(?, 10)",
                Integer.class,
                REGISTRATION_LOCK
        );

        if (!Integer.valueOf(1).equals(lockResult)) {
            throw new IllegalStateException(
                    "Registration is temporarily busy. Please try again."
            );
        }

        // Release the lock only after the transaction completes.
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        jdbcTemplate.queryForObject(
                                "SELECT RELEASE_LOCK(?)",
                                Integer.class,
                                REGISTRATION_LOCK
                        );
                    }
                }
        );

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        String mobile = request.getMobile().trim();

        if (appUserRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "Email is already registered"
            );
        }

        if (profileRepository.findByMobile(mobile).isPresent()) {
            throw new IllegalArgumentException(
                    "Mobile number is already registered"
            );
        }

        // Create login account.
        AppUser user = new AppUser();
        user.setEmail(email);
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );
        user.setActive(true);

        user = appUserRepository.save(user);

        // Create user profile.
        Profile profile = new Profile();
        profile.setId(user.getId());
        profile.setFullName(request.getFullName().trim());
        profile.setMobile(mobile);
        profile.setActive(true);

        profile = profileRepository.save(profile);

        // Assign ADMIN only to the first registered account.
        AppRole assignedRole =
                appUserRepository.count() == 1
                        ? AppRole.ADMIN
                        : AppRole.MEMBER;

        UserRole userRole = new UserRole();
        userRole.setUserId(user.getId());
        userRole.setRole(assignedRole);

        userRoleRepository.save(userRole);

        return buildAuthResponse(user, profile);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Incorrect email or password"
                        )
                );

        if (!user.isActive()
                || !passwordEncoder.matches(
                        request.getPassword(),
                        user.getPasswordHash()
                )) {

            throw new IllegalArgumentException(
                    "Incorrect email or password"
            );
        }

        Profile profile = profileRepository.findById(user.getId())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "User profile not found"
                        )
                );

        return buildAuthResponse(user, profile);
    }

@Transactional(readOnly = true)
public AuthResponse getCurrentUser(String userId) {

    AppUser user = appUserRepository.findById(userId)
            .orElseThrow(() ->
                    new IllegalArgumentException("User not found")
            );

    if (!user.isActive()) {
        throw new IllegalArgumentException("User account is inactive");
    }

    Profile profile = profileRepository.findById(userId)
            .orElseThrow(() ->
                    new IllegalStateException("User profile not found")
            );

    return buildAuthResponse(user, profile);
}


    private AuthResponse buildAuthResponse(
            AppUser user,
            Profile profile
    ) {

        List<String> roles = userRoleRepository
                .findByUserId(user.getId())
                .stream()
                .map(role -> role.getRole()
                        .name()
                        .toLowerCase(Locale.ROOT))
                .toList();

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail()
        );

        AuthResponse.ProfileResponse profileResponse =
                new AuthResponse.ProfileResponse(
                        profile.getFullName(),
                        profile.getMobile(),
                        profile.getVillage(),
                        profile.getMandal(),
                        profile.getDistrict(),
                        profile.getPincode()
                );

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                profileResponse,
                roles
        );
    }
}
