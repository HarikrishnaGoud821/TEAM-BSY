package com.teambsy.backend.service;

import com.teambsy.backend.entity.ReceiptCounter;
import com.teambsy.backend.repository.ReceiptCounterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

@Service
public class ReceiptNumberService {

    private final ReceiptCounterRepository receiptCounterRepository;

    public ReceiptNumberService(ReceiptCounterRepository receiptCounterRepository) {
        this.receiptCounterRepository = receiptCounterRepository;
    }

    @Transactional
    public String generateReceiptNumber() {

        int year = Year.now().getValue();
        String prefix = "BSY-" + year;

        receiptCounterRepository.insertIfMissing(prefix);

        ReceiptCounter counter =
                receiptCounterRepository.findByPrefixForUpdate(prefix);

        long nextNumber = counter.getLastValue() + 1;

        counter.setLastValue(nextNumber);
        receiptCounterRepository.save(counter);

        return prefix + "-" + String.format("%06d", nextNumber);
    }
}
