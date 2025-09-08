package com.example.farmbreedwithai.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "box_animals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoxAnimal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "breeding_box_id")
    private BreedingBox breedingBox;
    
    @ManyToOne
    @JoinColumn(name = "animal_id")
    private Animal animal;
    
    private Integer positionInBox;
    private Integer breedingSuitabilityScore;
    @Column(columnDefinition = "TEXT")
    private String aiAnalysisNotes;
}

