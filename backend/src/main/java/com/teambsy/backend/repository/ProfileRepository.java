
package com.teambsy.backend.repository;

import com.teambsy.backend.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.List;

public interface ProfileRepository extends JpaRepository<Profile, String> {

    Optional<Profile> findByMobile(String mobile);

    List<Profile> findByActiveTrueAndFullNameContainingIgnoreCaseOrderByFullName(
            String fullName,
            Pageable pageable
    );

}
