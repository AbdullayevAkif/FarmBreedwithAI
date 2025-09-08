package com.example.farmbreedwithai.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private Long totalAnimals;
    private Long readyForBreeding;
    private Long pregnant;
    private Long recentAnalyses;
    private Double averageBreedingScore;
    private Integer geneticDiversity;
    private List<String> urgentAlerts;
    private List<String> recommendations;
    private String overallHerdHealth;
}