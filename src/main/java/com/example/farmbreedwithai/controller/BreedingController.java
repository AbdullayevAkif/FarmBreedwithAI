package com.example.farmbreedwithai.controller;


import com.example.farmbreedwithai.dto.BreedingRecommendation;
import com.example.farmbreedwithai.entity.BreedingRecord;
import com.example.farmbreedwithai.service.BreedingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/breeding")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BreedingController {
    
    private final BreedingService breedingService;
    
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
    
    @GetMapping("/recommendations/{animalId}")
    public ResponseEntity<List<BreedingRecommendation>> getBestMatches(@PathVariable Long animalId) {
        return ResponseEntity.ok(breedingService.findBestMatches(animalId));
    }
}