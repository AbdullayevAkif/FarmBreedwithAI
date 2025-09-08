package com.example.farmbreedwithai.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Table(name = "breeding_recoords")
@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BreedingRecord {

    @Id
    Long id;

    @ManyToOne
    @JoinColumn(name = "animal_id")
    Animal animal;

    @ManyToOne
    @JoinColumn(name = "mate_id")
    Animal mate;

    LocalDate breedingDate;
    LocalDate expectedCalvingDate;
     Integer compatibilityScore;
     String aiRecommendations;
     String predictedTraits;
     Double predictedWeight;
     Double predictedValue;

     @Enumerated(EnumType.STRING)
     BreedingResult breedingResult;

     LocalDateTime createdAt;


     @PrePersist
     protected void onCreate(){
         createdAt = LocalDateTime.now();
     }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public enum BreedingResult {
         SCHEDULED,SUCCESSFUL,FAILED,PENDING,CANCELLED
     }
}
