package com.example.farmbreedwithai.service;


import com.example.farmbreedwithai.dto.BreedingRecommendation;
import com.example.farmbreedwithai.entity.Animal;
import com.example.farmbreedwithai.entity.BreedingRecord;
import com.example.farmbreedwithai.repository.BreedingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BreedingService {
    
    private final BreedingRecordRepository breedingRecordRepository;
    private final AnimalService animalService;
    
    public List<BreedingRecord> getBreedingHistory(Long animalId) {
        return breedingRecordRepository.findBreedingHistoryByAnimal(animalId);
    }
    
    public BreedingRecord scheduleBreeding(Long animal1Id, Long animal2Id, LocalDate breedingDate) {
        Animal animal1 = animalService.getAnimalById(animal1Id);
        Animal animal2 = animalService.getAnimalById(animal2Id);
        
        BreedingRecord record = new BreedingRecord();
        record.setAnimal(animal1);
        record.setMate(animal2);
        record.setBreedingDate(breedingDate);
        record.setExpectedCalvingDate(breedingDate.plusDays(280));
        record.setCompatibilityScore(calculateCompatibilityScore(animal1, animal2));
        record.setBreedingResult(BreedingRecord.BreedingResult.SCHEDULED);
        
        return breedingRecordRepository.save(record);
    }
    
    public List<BreedingRecommendation> findBestMatches(Long animalId) {
        Animal targetAnimal = animalService.getAnimalById(animalId);
        
        Animal.Gender oppositeGender = targetAnimal.getGender() == Animal.Gender.MALE ? 
            Animal.Gender.FEMALE : Animal.Gender.MALE;
        
        List<Animal> candidates = animalService.getBreedingCandidates(oppositeGender, 70);
        
        return candidates.stream()
            .map(candidate -> createBreedingRecommendation(targetAnimal, candidate))
            .sorted((a, b) -> b.getCompatibilityScore().compareTo(a.getCompatibilityScore()))
            .limit(5)
            .toList();
    }
    
    private Integer calculateCompatibilityScore(Animal animal1, Animal animal2) {
        int score = 60;
        if (animal1.getBreedingScore() != null && animal2.getBreedingScore() != null) {
            score += (animal1.getBreedingScore() + animal2.getBreedingScore()) / 4;
        }
        if (!animal1.getBreed().equals(animal2.getBreed())) {
            score += 15;
        }
        return Math.min(100, score);
    }
    
    private BreedingRecommendation createBreedingRecommendation(Animal animal1, Animal animal2) {
        BreedingRecommendation rec = new BreedingRecommendation();
        rec.setAnimal1Id(animal1.getId());
        rec.setAnimal2Id(animal2.getId());
        rec.setAnimal1Name(animal1.getName());
        rec.setAnimal2Name(animal2.getName());
        rec.setCompatibilityScore(calculateCompatibilityScore(animal1, animal2));
        rec.setReasoning("High genetic compatibility based on breeding scores and diversity");
        rec.setPredictedOffspringValue(1500.0 + (rec.getCompatibilityScore() * 20));
        rec.setPredictedTraits("Strong build, good production potential");
        rec.setRiskFactors("Monitor for genetic diversity");
        return rec;
    }
}