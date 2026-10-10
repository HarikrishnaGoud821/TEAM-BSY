package com.teambsy.backend.repository;

import com.teambsy.backend.model.User;
import com.teambsy.backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByMobileNumber(String mobileNumber);

    Optional<User> findByEmail(String email);

    List<User> findByRole(Role role);

    long countByRole(Role role);
}