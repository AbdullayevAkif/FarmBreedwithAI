package com.example.farmbreedwithai.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "breeding_boxes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BreedingBox {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String sessionName;
    
    @OneToMany(mappedBy = "breedingBox", cascade = CascadeType.ALL)
    private List<BoxAnimal> animals;
    
    @Column(columnDefinition = "TEXT")
    private String aiRecommendations;
    
    private Integer diversityScore;
    private String bestPairs;
    private String warnings;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}