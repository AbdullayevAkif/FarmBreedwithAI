package com.example.farmbreedwithai.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BreedingRecommendation {
    private Long animal1Id;
    private Long animal2Id;
    private String animal1Name;
    private String animal2Name;
    private Integer compatibilityScore;
    private String reasoning;
    private Double predictedOffspringValue;
    private String predictedTraits;
    private String riskFactors;
}