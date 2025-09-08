package com.example.farmbreedwithai.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIAnalysisResponse {
    private String animalType;
    private String breed;
    private String physicalCondition;
    private Integer estimatedAge;
    private String breedingReadiness;
    private String healthStatus;
    private Integer breedingScore;
    private String traits;
    private String recommendations;
    private Double confidence;
}