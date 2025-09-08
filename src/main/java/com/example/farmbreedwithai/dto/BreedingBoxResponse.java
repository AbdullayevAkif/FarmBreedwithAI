package com.example.farmbreedwithai.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BreedingBoxResponse {
    private Long boxId;
    private String sessionName;
    private List<AIAnalysisResponse> animalAnalysis;
    private List<BreedingRecommendation> breedingPairs;
    private List<String> unsuitableAnimals;
    private Integer overallDiversityScore;
    private String generalRecommendations;
}