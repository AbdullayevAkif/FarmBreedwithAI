package com.example.farmbreedwithai.service;

import com.example.farmbreedwithai.dto.DashboardResponse;
import com.example.farmbreedwithai.entity.Animal;
import com.example.farmbreedwithai.repository.AnimalRepository;
import com.example.farmbreedwithai.repository.GeneticAnalysisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final AnimalRepository animalRepository;
    private final GeneticAnalysisRepository geneticAnalysisRepository;
    private final GeminiService geminiService;
    
    public DashboardResponse generateDashboard() {
        List<Animal> allAnimals = animalRepository.findAll();
        
        DashboardResponse dashboard = new DashboardResponse();
        dashboard.setTotalAnimals((long) allAnimals.size());
        dashboard.setReadyForBreeding(allAnimals.stream()
            .filter(a -> a.getBreedingStatus() == Animal.BreedingStatus.READY)
            .count());
        dashboard.setPregnant(allAnimals.stream()
            .filter(a -> a.getBreedingStatus() == Animal.BreedingStatus.PREGNANT)
            .count());
        
        dashboard.setAverageBreedingScore(allAnimals.stream()
            .filter(a -> a.getBreedingScore() != null)
            .mapToInt(Animal::getBreedingScore)
            .average()
            .orElse(0.0));
        
        dashboard.setGeneticDiversity(calculateGeneticDiversity(allAnimals));
        dashboard.setUrgentAlerts(generateUrgentAlerts(allAnimals));
        dashboard.setRecommendations(generateRecommendations(allAnimals));
        dashboard.setOverallHerdHealth(assessOverallHealth(allAnimals));
        
        return dashboard;
    }
    
    public String getBreedingAlerts() {
        List<Animal> animals = animalRepository.findAll();
        List<String> alerts = new ArrayList<>();
        
        for (Animal animal : animals) {
            if (animal.getBreedingScore() != null && animal.getBreedingScore() < 60) {
                alerts.add(animal.getName() + " has low breeding score: " + animal.getBreedingScore());
            }
            if (animal.getHealthStatus() == Animal.HealthStatus.POOR) {
                alerts.add(animal.getName() + " requires immediate health attention");
            }
        }
        
        return String.join("; ", alerts);
    }
    
    private Integer calculateGeneticDiversity(List<Animal> animals) {
        if (animals.isEmpty()) return 0;
        long uniqueBreeds = animals.stream().map(Animal::getBreed).distinct().count();
        return (int) ((uniqueBreeds * 100.0) / animals.size());
    }
    
    private List<String> generateUrgentAlerts(List<Animal> animals) {
        List<String> alerts = new ArrayList<>();
        
        for (Animal animal : animals) {
            if (animal.getBreedingScore() != null && animal.getBreedingScore() < 50) {
                alerts.add("LOW BREEDING SCORE: " + animal.getName() + " (" + animal.getBreedingScore() + "%)");
            }
            if (animal.getHealthStatus() == Animal.HealthStatus.POOR) {
                alerts.add("HEALTH ALERT: " + animal.getName() + " requires veterinary attention");
            }
        }
        
        if (alerts.isEmpty()) {
            alerts.add("No urgent alerts - herd in good condition");
        }
        
        return alerts;
    }
    
    private List<String> generateRecommendations(List<Animal> animals) {
        List<String> recommendations = new ArrayList<>();
        
        long readyMales = animals.stream()
            .filter(a -> a.getGender() == Animal.Gender.MALE && a.getBreedingStatus() == Animal.BreedingStatus.READY)
            .count();
        
        long readyFemales = animals.stream()
            .filter(a -> a.getGender() == Animal.Gender.FEMALE && a.getBreedingStatus() == Animal.BreedingStatus.READY)
            .count();
        
        if (readyMales > 0 && readyFemales > 0) {
            recommendations.add("Optimal breeding window: " + Math.min(readyMales, readyFemales) + " potential pairs available");
        }
        
        if (calculateGeneticDiversity(animals) < 70) {
            recommendations.add("Consider introducing new genetic lines to improve diversity");
        }
        
        recommendations.add("Use Breeding Box feature to analyze up to 7 animals simultaneously");
        
        return recommendations;
    }
    
    private String assessOverallHealth(List<Animal> animals) {
        if (animals.isEmpty()) return "No animals to assess";
        
        double avgHealth = animals.stream()
            .mapToInt(a -> a.getHealthStatus().ordinal())
            .average()
            .orElse(0.0);
        
        if (avgHealth >= 3.0) return "Excellent";
        if (avgHealth >= 2.0) return "Good";
        if (avgHealth >= 1.0) return "Fair";
        return "Needs Attention";
    }
}