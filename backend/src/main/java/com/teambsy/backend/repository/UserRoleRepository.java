
package com.teambsy.backend.repository;

import com.teambsy.backend.entity.UserRole;
import com.teambsy.backend.entity.AppRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRole, String> {

    List<UserRole> findByUserId(String userId);

    boolean existsByUserIdAndRole(String userId, AppRole role);

    List<UserRole> findByRole(AppRole role);

    long countByRole(AppRole role);

    void deleteByUserIdAndRole(String userId, AppRole role);
}
