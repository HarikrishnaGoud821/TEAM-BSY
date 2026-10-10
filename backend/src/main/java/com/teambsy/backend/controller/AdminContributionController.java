package com.teambsy.backend.controller;

import com.teambsy.backend.contribution.ContributionResponse;
import com.teambsy.backend.contribution.ContributionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/contributions")
public class AdminContributionController {

    private final ContributionService contributionService;

    public AdminContributionController(
            ContributionService contributionService) {

        this.contributionService =
                contributionService;
    }

    /*
     * GET ALL CONTRIBUTIONS
     */
    @GetMapping
    public ResponseEntity<List<ContributionResponse>>
    getAllContributions() {

        return ResponseEntity.ok(
                contributionService
                        .getAllContributions()
        );
    }

    /*
     * VERIFY OFFLINE CONTRIBUTION
     */
    @PutMapping("/{id}/verify")
    public ResponseEntity<ContributionResponse>
    verifyContribution(
            @PathVariable Long id,
            @RequestParam Long adminId) {

        return ResponseEntity.ok(
                contributionService
                        .verifyContribution(
                                id,
                                adminId
                        )
        );
    }

    /*
     * REJECT OFFLINE CONTRIBUTION
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<ContributionResponse>
    rejectContribution(
            @PathVariable Long id,
            @RequestParam Long adminId) {

        return ResponseEntity.ok(
                contributionService
                        .rejectContribution(
                                id,
                                adminId
                        )
        );
    }
}