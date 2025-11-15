package com.example.farmbreedwithai.controller;

import com.example.farmbreedwithai.dto.BreedingRecommendation;
import com.example.farmbreedwithai.dto.SmartRecommendationsRequest;
import com.example.farmbreedwithai.entity.BreedingRecord;
import com.example.farmbreedwithai.service.BreedingBoxService;
import com.example.farmbreedwithai.service.BreedingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/breeding")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BreedingController {
    
    private final BreedingService breedingService;
    private final BreedingBoxService breedingBoxService;
    
    @GetMapping("/history/{animalId}")
    public ResponseEntity<List<BreedingRecord>> getBreedingHistory(@PathVariable Long animalId) {
        return ResponseEntity.ok(breedingService.getBreedingHistory(animalId));
    }
    
    @PostMapping("/schedule")
    public ResponseEntity<BreedingRecord> scheduleBreeding(@RequestParam Long animal1Id,
                                                           @RequestParam Long animal2Id,
                                                           @RequestParam LocalDate breedingDate) {
        BreedingRecord record = breedingService.scheduleBreeding(animal1Id, animal2Id, breedingDate);
        return ResponseEntity.ok(record);
    }

    @GetMapping("/history")
    public ResponseEntity<List<BreedingRecord>> getBreedingHistoryAll() {
        return ResponseEntity.ok(java.util.Collections.emptyList());
    }
    
    @GetMapping("/recommendations/{animalId}")
    public ResponseEntity<List<BreedingRecommendation>> getBestMatches(@PathVariable Long animalId) {
        return ResponseEntity.ok(breedingService.findBestMatches(animalId));
    }

    @PostMapping("/smart-recommendations")
    public ResponseEntity<List<Map<String, Object>>> getSmartRecommendations(@RequestBody SmartRecommendationsRequest req) {
        List<Map<String, Object>> out = breedingBoxService.computeSmartRecommendations(req);
        return ResponseEntity.ok(out);
    }
}