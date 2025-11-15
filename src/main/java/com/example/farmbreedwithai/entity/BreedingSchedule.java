package com.example.farmbreedwithai.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "breeding_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BreedingSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "animal_id")
    private Animal animal;
    
    private String title;
    private String type;
    private String description;
    private String species;
    private Integer durationDays;
    
    private LocalDate startDate;
    private LocalDate scheduledDate;
    private String notes;
    private Boolean completed;
    private String reminderType;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (completed == null) completed = false;
    }
}