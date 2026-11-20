package com.teambsy.backend.service;

import com.teambsy.backend.dto.ExpenseCreateRequest;
import com.teambsy.backend.dto.ExpenseItemResponse;
import com.teambsy.backend.dto.ExpenseResponse;
import com.teambsy.backend.entity.Expense;
import com.teambsy.backend.entity.ExpenseItem;
import com.teambsy.backend.repository.ExpenseItemRepository;
import com.teambsy.backend.repository.ExpenseRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class ExpenseService {

    private static final Set<String> CATEGORIES = Set.of(
            "Decoration", "Food & Prasadam", "Sound & Lights",
            "Pooja Items", "Transport", "Printing", "Rent", "Other"
    );

    private static final Set<String> PAYMENT_METHODS = Set.of(
            "CASH", "UPI", "BANK_TRANSFER", "OTHER"
    );

    private final ExpenseRepository expenseRepository;
    private final ExpenseItemRepository itemRepository;
    private final ExpenseFileStorageService fileStorageService;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            ExpenseItemRepository itemRepository,
            ExpenseFileStorageService fileStorageService
    ) {
        this.expenseRepository = expenseRepository;
        this.itemRepository = itemRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpenses(
            String userId,
            boolean canViewAll
    ) {
        List<Expense> expenses = canViewAll
                ? expenseRepository.findAllByOrderByCreatedAtDesc()
                : expenseRepository.findByMentorIdOrderByCreatedAtDesc(userId);

        return expenses.stream()
                .map(e -> toResponse(e, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public ExpenseResponse getExpense(
            String id,
            String userId,
            boolean canViewAll
    ) {
        Expense expense = expenseRepository.findById(id).orElse(null);

        if (expense == null) {
            return null;
        }

        if (!canViewAll && !userId.equals(expense.getMentorId())) {
            return null;
        }

        return toResponse(expense, true);
    }

    @Transactional
    public ExpenseResponse createExpense(
            String userId,
            String mentorName,
            String mentorMobile,
            ExpenseCreateRequest request,
            MultipartFile receipt
    ) {
        validateRequest(request);

        if (receipt == null || receipt.isEmpty()) {
            throw new IllegalArgumentException("Attach a photo of the shop receipt");
        }

        BigDecimal total = BigDecimal.ZERO;

        for (ExpenseCreateRequest.ItemRequest item : request.items) {
            total = total.add(
                    item.quantity.multiply(item.unit_price)
                            .setScale(2, RoundingMode.HALF_UP)
            );
        }

        String fileKey = null;

        try {
            Expense expense = new Expense();

            expense.setMentorId(userId);
            expense.setMentorName(mentorName);
            expense.setMentorMobile(clean(mentorMobile));

            expense.setExpenseDate(
                    request.expense_date != null
                            ? request.expense_date
                            : LocalDate.now()
            );

            expense.setCategory(request.category.trim());
            expense.setPurpose(request.purpose.trim());
            expense.setDescription(clean(request.description));
            expense.setNotes(clean(request.notes));

            expense.setShopName(request.shop_name.trim());
            expense.setShopOwner(clean(request.shop_owner));
            expense.setShopContact(clean(request.shop_contact));
            expense.setShopAddress(clean(request.shop_address));

            expense.setVillage(clean(request.village));
            expense.setMandal(clean(request.mandal));
            expense.setDistrict(clean(request.district));
            expense.setPincode(clean(request.pincode));

            expense.setPaymentMethod(request.payment_method);
            expense.setPaymentReference(clean(request.payment_reference));

            expense.setAmount(total);
            expense.setStatus("PENDING");

            Expense savedExpense = expenseRepository.saveAndFlush(expense);

            final String savedExpenseId = savedExpense.getId();

            List<ExpenseItem> items = request.items.stream().map(item -> {
                ExpenseItem entity = new ExpenseItem();
                entity.setExpenseId(savedExpenseId);
                entity.setItemName(item.item_name.trim());
                entity.setQuantity(item.quantity);
                entity.setUnitPrice(item.unit_price);
                return entity;
            }).toList();

            itemRepository.saveAllAndFlush(items);

            fileKey = fileStorageService.save(receipt);

            savedExpense.setReceiptFileKey(fileKey);
            savedExpense.setReceiptFileName(receipt.getOriginalFilename());
            savedExpense.setReceiptContentType(receipt.getContentType());
            savedExpense.setReceiptUploadedAt(LocalDateTime.now());

            savedExpense = expenseRepository.saveAndFlush(savedExpense);

            return toResponse(savedExpense, true);

        } catch (IOException exception) {
            fileStorageService.delete(fileKey);
            throw new IllegalArgumentException(
                    "Could not save the shop receipt"
            );
        } catch (RuntimeException exception) {
            fileStorageService.delete(fileKey);
            throw exception;
        }
    }

    @Transactional
    public ExpenseResponse reviewExpense(
            String id,
            String reviewerId,
            String reviewerName,
            String status,
            String rejectionReason
    ) {
        if (!"APPROVED".equals(status) && !"REJECTED".equals(status)) {
            throw new IllegalArgumentException("Invalid review status");
        }

        Expense expense = expenseRepository.findById(id).orElse(null);

        if (expense == null) {
            return null;
        }


        if ("REJECTED".equals(status) &&
                (rejectionReason == null ||
                        rejectionReason.trim().length() < 3)) {
            throw new IllegalArgumentException(
                    "Give a reason for rejecting"
            );
        }

        expense.setStatus(status);
        expense.setRejectionReason(
                "REJECTED".equals(status)
                        ? rejectionReason.trim()
                        : null
        );
        expense.setReviewedBy(reviewerId);
        expense.setReviewedByName(reviewerName);
        expense.setReviewedAt(LocalDateTime.now());

        Expense saved = expenseRepository.save(expense);

        return toResponse(saved, true);
    }

    private void validateRequest(ExpenseCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Expense details are required");
        }

        if (request.shop_name == null ||
                request.shop_name.trim().length() < 2) {
            throw new IllegalArgumentException("Enter the shop name");
        }

        if (request.shop_name.trim().length() > 255) {
            throw new IllegalArgumentException("Shop name is too long");
        }

        if (request.purpose == null ||
                request.purpose.trim().length() < 2) {
            throw new IllegalArgumentException("Enter the purpose");
        }

        if (!CATEGORIES.contains(request.category)) {
            throw new IllegalArgumentException("Select a valid category");
        }

        if (request.payment_method == null ||
                !PAYMENT_METHODS.contains(request.payment_method)) {
            throw new IllegalArgumentException("Select a valid payment method");
        }

        if (!"CASH".equals(request.payment_method) &&
                (request.payment_reference == null ||
                        request.payment_reference.isBlank())) {
            throw new IllegalArgumentException(
                    "Enter the UPI / bank reference number"
            );
        }

        if (request.pincode != null &&
                !request.pincode.isBlank() &&
                !request.pincode.trim().matches("\\d{6}")) {
            throw new IllegalArgumentException("Pincode must be 6 digits");
        }

        if (request.items == null || request.items.isEmpty()) {
            throw new IllegalArgumentException("Add at least one item");
        }

        BigDecimal maxAmount = new BigDecimal("9999999999.99");

        for (ExpenseCreateRequest.ItemRequest item : request.items) {
            if (item == null || item.item_name == null ||
                    item.item_name.isBlank()) {
                throw new IllegalArgumentException("Enter every item name");
            }

            if (item.item_name.trim().length() > 255) {
                throw new IllegalArgumentException("Item name is too long");
            }

            if (item.quantity == null ||
                    item.quantity.compareTo(BigDecimal.ZERO) <= 0 ||
                    item.quantity.precision() > 10 ||
                    item.quantity.scale() > 2) {
                throw new IllegalArgumentException(
                        "Each item needs a valid quantity"
                );
            }

            if (item.unit_price == null ||
                    item.unit_price.compareTo(BigDecimal.ZERO) < 0 ||
                    item.unit_price.precision() > 12 ||
                    item.unit_price.scale() > 2) {
                throw new IllegalArgumentException(
                        "Each item needs a valid unit price"
                );
            }

            if (item.quantity.multiply(item.unit_price)
                    .compareTo(maxAmount) > 0) {
                throw new IllegalArgumentException("Item total is too large");
            }
        }
    }

    private ExpenseResponse toResponse(Expense expense, boolean includeItems) {
        List<ExpenseItemResponse> items = includeItems
                ? itemRepository.findByExpenseIdOrderByIdAsc(expense.getId())
                        .stream()
                        .map(item -> new ExpenseItemResponse(
                                item.getId(),
                                item.getExpenseId(),
                                item.getItemName(),
                                item.getQuantity(),
                                item.getUnitPrice(),
                                item.getTotalPrice() != null
                                        ? item.getTotalPrice()
                                        : item.getQuantity().multiply(item.getUnitPrice())
                        ))
                        .toList()
                : List.of();

        return new ExpenseResponse(expense, items);
    }

    private String clean(String value) {
        return value == null || value.isBlank()
                ? null
                : value.trim();
    }
}