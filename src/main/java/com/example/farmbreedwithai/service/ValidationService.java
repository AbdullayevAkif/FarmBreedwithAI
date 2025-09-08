package com.example.farmbreedwithai.service;


import com.example.farmbreedwithai.entity.Animal;
import org.springframework.stereotype.Service;
import java.time.LocalDate;

@Service
public class ValidationService {
    
    public boolean isValidBreedingPair(Animal animal1, Animal animal2) {
        if (animal1.getId().equals(animal2.getId())) {
            return false;
        }
        
        if (animal1.getGender().equals(animal2.getGender())) {
            return false;
        }
        
        if (!animal1.getType().equals(animal2.getType())) {
            return false;
        }
        
        if (animal1.getBreedingStatus() != Animal.BreedingStatus.READY || 
            animal2.getBreedingStatus() != Animal.BreedingStatus.READY) {
            return false;
        }
        
        return true;
    }
    
    public boolean isBreedingAge(Animal animal) {
        if (animal.getBirthDate() == null) return true;
        
        int ageInMonths = (int) java.time.Period.between(animal.getBirthDate(), LocalDate.now()).toTotalMonths();
        
        return switch (animal.getType().toLowerCase()) {
            case "cattle" -> ageInMonths >= 15 && ageInMonths <= 120;
            case "sheep", "goat" -> ageInMonths >= 8 && ageInMonths <= 84;
            case "pig" -> ageInMonths >= 6 && ageInMonths <= 60;
            default -> ageInMonths >= 12;
        };
    }
    
    public String validateAnimalData(Animal animal) {
        StringBuilder errors = new StringBuilder();
        
        if (animal.getName() == null || animal.getName().trim().isEmpty()) {
            errors.append("Animal name is required. ");
        }
        
        if (animal.getType() == null || animal.getType().trim().isEmpty()) {
            errors.append("Animal type is required. ");
        }
        
        if (animal.getGender() == null) {
            errors.append("Animal gender is required. ");
        }
        
        if (animal.getBirthDate() != null && animal.getBirthDate().isAfter(LocalDate.now())) {
            errors.append("Birth date cannot be in the future. ");
        }
        
        return errors.toString().trim();
    }
}