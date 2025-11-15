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
@Table(name = "animals")
@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Animal {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     Long id;

     @Column(nullable = false)
     String name;

     @Column(nullable = false)
     String type;

     @Column(nullable = false)
     String breed;

     @Enumerated(EnumType.STRING)
     Gender gender;


     LocalDate birthDate;

     String photoUrl;

     Double weight;

     @Enumerated(EnumType.STRING)
     HealthStatus healthStatus;

     @Enumerated(EnumType.STRING)
     BreedingStatus breedingStatus;


     Integer breedingScore;
     @Column(length = 2000)
     String geneticsTraits;
     String temperament;
     String color;
     String size;
     @Column(length = 2000)
     String notes;
     Integer offSpringCount;
     LocalDateTime createdAt;
     LocalDateTime updatedAt;


     @PrePersist
     protected void onCreate(){
         this.createdAt = LocalDateTime.now();
         this.updatedAt = LocalDateTime.now();
     }

     @PreUpdate
     protected void onUpdate(){
         this.updatedAt = LocalDateTime.now();
     }


     public enum HealthStatus {
         EXCELLENT,GOOD,FAIR,POOR,UNKNOWN
     }

     public enum BreedingStatus {
         READY,PREGNANT,BREEDING,NOT_READY,RETIRED
     }

    public enum Gender {
        MALE, FEMALE, UNKNOWN
    }

}
