package com.example.farmbreedwithai.service;


import com.example.farmbreedwithai.entity.Animal;
import com.example.farmbreedwithai.entity.BreedingRecord;
import com.example.farmbreedwithai.repository.AnimalRepository;
import com.example.farmbreedwithai.repository.BreedingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    
    private final AnimalRepository animalRepository;
    private final BreedingRecordRepository breedingRecordRepository;
    
    public Map<String, Object> getBreedingAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        
        List<Animal> allAnimals = animalRepository.findAll();
        List<BreedingRecord> allRecords = breedingRecordRepository.findAll();
        
        analytics.put("totalAnimals", allAnimals.size());
        analytics.put("breedingSuccessRate", calculateSuccessRate(allRecords));
        analytics.put("averageOffspringPerAnimal", calculateAverageOffspring(allAnimals));
        analytics.put("breedDistribution", getBreedDistribution(allAnimals));
        analytics.put("monthlyBreedingTrend", getMonthlyBreedingTrend(allRecords));
        analytics.put("topPerformingBreeds", getTopPerformingBreeds(allAnimals));
        
        return analytics;
    }
    
    private Double calculateSuccessRate(List<BreedingRecord> records) {
        if (records.isEmpty()) return 0.0;
        
        long successful = records.stream()
            .filter(r -> r.getBreedingResult() == BreedingRecord.BreedingResult.SUCCESSFUL)
            .count();
        
        return (successful * 100.0) / records.size();
    }
    
    private Double calculateAverageOffspring(List<Animal> animals) {
        return animals.stream()
            .filter(a -> a.getOffSpringCount() != null)
            .mapToInt(Animal::getOffSpringCount)
            .average()
            .orElse(0.0);
    }
    
    private Map<String, Long> getBreedDistribution(List<Animal> animals) {
        return animals.stream()
            .collect(Collectors.groupingBy(Animal::getBreed, Collectors.counting()));
    }
    
    private Map<String, Long> getMonthlyBreedingTrend(List<BreedingRecord> records) {
        return records.stream()
            .filter(r -> r.getBreedingDate().isAfter(LocalDate.now().minusMonths(12)))
            .collect(Collectors.groupingBy(
                r -> r.getBreedingDate().getYear() + "-" + String.format("%02d", r.getBreedingDate().getMonthValue()),
                Collectors.counting()
            ));
    }
    
    private List<String> getTopPerformingBreeds(List<Animal> animals) {
        return animals.stream()
            .filter(a -> a.getBreedingScore() != null)
            .collect(Collectors.groupingBy(Animal::getBreed,
                Collectors.averagingInt(Animal::getBreedingScore)))
            .entrySet().stream()
            .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
            .limit(5)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }
}