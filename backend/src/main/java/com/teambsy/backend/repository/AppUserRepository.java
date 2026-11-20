
package com.teambsy.backend.repository;

import com.teambsy.backend.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, String> {

    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);
}

