package com.example.farmbreedwithai.controller;

import com.example.farmbreedwithai.dto.BreedingBoxRequest;
import com.example.farmbreedwithai.dto.BreedingBoxResponse;
import com.example.farmbreedwithai.entity.BreedingBox;
import com.example.farmbreedwithai.dto.SelectedBreedingBoxRequest;
import com.example.farmbreedwithai.dto.DetailedBreedingAnalysisResponse;
import com.example.farmbreedwithai.dto.OffspringPredictionRequest;
import com.example.farmbreedwithai.dto.OffspringPrediction;

import com.example.farmbreedwithai.repository.BreedingBoxRepository;
import com.example.farmbreedwithai.service.BreedingBoxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/breeding-box")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BreedingBoxController {
    
    private final BreedingBoxService breedingBoxService;
    private final BreedingBoxRepository breedingBoxRepository;
    
    @PostMapping("/analyze")
    public ResponseEntity<BreedingBoxResponse> analyzeBreedingBox(@RequestBody BreedingBoxRequest request) {
        BreedingBoxResponse response = breedingBoxService.processBreedingBox(request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/sessions")
    public ResponseEntity<List<BreedingBox>> getAllSessions() {
        return ResponseEntity.ok(breedingBoxRepository.findAllByOrderByCreatedAtDesc());
    }
    
    @GetMapping("/sessions/{id}")
    public ResponseEntity<BreedingBox> getSession(@PathVariable Long id) {
        return breedingBoxRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/breeding/history")
    public ResponseEntity<List<Object>> getBreedingHistory() {
        return ResponseEntity.ok(java.util.Collections.emptyList());
    }

    @PostMapping("/deep-analyze")
    public ResponseEntity<DetailedBreedingAnalysisResponse> deepAnalyze(@RequestBody SelectedBreedingBoxRequest request) {
        DetailedBreedingAnalysisResponse resp = breedingBoxService.deepAnalyzeSelected(request);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/predict-offspring")
    public ResponseEntity<OffspringPrediction> predictOffspring(@RequestBody OffspringPredictionRequest request) {
        return ResponseEntity.ok(breedingBoxService.predictOffspring(request));
    }

    @PostMapping("/sessions")
    public ResponseEntity<BreedingBox> createSession(@RequestBody DetailedBreedingAnalysisResponse response) {
        return ResponseEntity.ok(breedingBoxService.saveSessionFromAnalysis(response));
    }
}