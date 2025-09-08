package com.example.farmbreedwithai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.LocalDateTime;

@Entity
@Table(name = "genetic_analysis")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeneticAnalysis {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "animal_id")
    private Animal animal;
    
    private String photoUrl;
    private Integer overallScore;
    private String physicalTraits;
    private String healthIndicators;
    private String breedingPotential;
    private String aiAnalysisResult;
    private Double confidenceScore;
    
    private LocalDateTime analyzedAt;
    
    @PrePersist
    protected void onCreate() {
        analyzedAt = LocalDateTime.now();
    }
}
