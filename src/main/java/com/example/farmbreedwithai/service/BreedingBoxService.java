package com.example.farmbreedwithai.service;

import com.example.farmbreedwithai.dto.*;
import com.example.farmbreedwithai.entity.Animal;
import com.example.farmbreedwithai.entity.BoxAnimal;
import com.example.farmbreedwithai.entity.BreedingBox;
import com.example.farmbreedwithai.repository.AnimalRepository;
import com.example.farmbreedwithai.repository.BoxAnimalRepository;
import com.example.farmbreedwithai.repository.BreedingBoxRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BreedingBoxService {
    
    private final GeminiService geminiService;
    private final PhotoAnalysisService photoAnalysisService;
    private final BreedingBoxRepository breedingBoxRepository;
    private final BoxAnimalRepository boxAnimalRepository;
    private final AnimalRepository animalRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Transactional
    public BreedingBoxResponse processBreedingBox(BreedingBoxRequest request) {
        BreedingBox breedingBox = new BreedingBox();
        breedingBox.setSessionName(request.getSessionName());
        breedingBox = breedingBoxRepository.save(breedingBox);
        
        List<AIAnalysisResponse> analysisResults = new ArrayList<>();
        List<Animal> analyzedAnimals = new ArrayList<>();
        
        for (int i = 0; i < request.getAnimalPhotos().size() && i < 7; i++) {
            PhotoAnalysisRequest photoRequest = request.getAnimalPhotos().get(i);
            
            String imageData = photoRequest.getPhotoBase64();
            if (imageData == null || imageData.trim().isEmpty()) {
                imageData = "cow.jpg";
            }
            
            AIAnalysisResponse analysis = photoAnalysisService.analyzeAnimalPhoto(
                imageData, 
                photoRequest.getAnimalName()
            );
            analysisResults.add(analysis);
            
            Animal animal = createTempAnimal(photoRequest, analysis);
            animal = animalRepository.save(animal);
            analyzedAnimals.add(animal);
            
            BoxAnimal boxAnimal = new BoxAnimal();
            boxAnimal.setBreedingBox(breedingBox);
            boxAnimal.setAnimal(animal);
            boxAnimal.setPositionInBox(i + 1);
            boxAnimal.setBreedingSuitabilityScore(analysis.getBreedingScore());
            boxAnimal.setAiAnalysisNotes(analysis.getRecommendations());
            boxAnimalRepository.save(boxAnimal);
        }
        
        List<BreedingRecommendation> breedingRecommendations = generateBreedingPairs(analyzedAnimals);
        String unsuitable = findUnsuitableAnimals(analysisResults);
        
        String combinedData = buildCombinedAnalysisData(analysisResults);
        String aiRecommendations = geminiService.generateBreedingRecommendations(combinedData);
        
        breedingBox.setAiRecommendations(aiRecommendations);
        breedingBox.setDiversityScore(calculateDiversityScore(analyzedAnimals));
        breedingBox.setBestPairs(formatBestPairs(breedingRecommendations));
        breedingBox.setWarnings(unsuitable);
        breedingBoxRepository.save(breedingBox);
        
        return buildBreedingBoxResponse(breedingBox, analysisResults, breedingRecommendations, unsuitable);
    }
    
    private Animal createTempAnimal(PhotoAnalysisRequest request, AIAnalysisResponse analysis) {
        Animal animal = new Animal();
        animal.setName(request.getAnimalName());
        animal.setType(analysis.getAnimalType());
        animal.setBreed(analysis.getBreed());
        animal.setBreedingScore(analysis.getBreedingScore());
        animal.setGeneticsTraits(analysis.getTraits());
        animal.setHealthStatus(parseHealthStatus(analysis.getHealthStatus()));
        animal.setBreedingStatus(parseBreedingStatus(analysis.getBreedingReadiness()));
        animal.setGender(parseGender(analysis.getAnimalType()));
        return animal;
    }
    
    private List<BreedingRecommendation> generateBreedingPairs(List<Animal> animals) {
        List<BreedingRecommendation> recommendations = new ArrayList<>();
        
        for (int i = 0; i < animals.size(); i++) {
            for (int j = i + 1; j < animals.size(); j++) {
                Animal animal1 = animals.get(i);
                Animal animal2 = animals.get(j);
                
                if (isCompatiblePair(animal1, animal2)) {
                    BreedingRecommendation rec = new BreedingRecommendation();
                    rec.setAnimal1Id(animal1.getId());
                    rec.setAnimal2Id(animal2.getId());
                    rec.setAnimal1Name(animal1.getName());
                    rec.setAnimal2Name(animal2.getName());
                    rec.setCompatibilityScore(calculateCompatibility(animal1, animal2));
                    rec.setReasoning("Strong genetic compatibility based on traits and health scores");
                    rec.setPredictedOffspringValue(estimateOffspringValue(animal1, animal2));
                    rec.setPredictedTraits(predictOffspringTraits(animal1, animal2));
                    recommendations.add(rec);
                }
            }
        }
        
        return recommendations.stream()
            .sorted((a, b) -> b.getCompatibilityScore().compareTo(a.getCompatibilityScore()))
            .limit(5)
            .toList();
    }
    
    private boolean isCompatiblePair(Animal animal1, Animal animal2) {
        if (animal1.getGender() == null || animal2.getGender() == null) {
            return false;
        }
        return !animal1.getGender().equals(animal2.getGender()) &&
               animal1.getType().equals(animal2.getType()) &&
               animal1.getBreedingStatus() == Animal.BreedingStatus.READY &&
               animal2.getBreedingStatus() == Animal.BreedingStatus.READY;
    }
    
    private Integer calculateCompatibility(Animal animal1, Animal animal2) {
        int baseScore = 50;
        if (animal1.getBreedingScore() != null && animal2.getBreedingScore() != null) {
            baseScore += (animal1.getBreedingScore() + animal2.getBreedingScore()) / 4;
        }
        if (!animal1.getBreed().equals(animal2.getBreed())) {
            baseScore += 10;
        }
        return Math.min(100, baseScore);
    }
    
    private Double estimateOffspringValue(Animal animal1, Animal animal2) {
        double baseValue = 1200.0;
        if (animal1.getBreedingScore() != null && animal2.getBreedingScore() != null) {
            baseValue += (animal1.getBreedingScore() + animal2.getBreedingScore()) * 10;
        }
        return baseValue;
    }
    
    private String predictOffspringTraits(Animal animal1, Animal animal2) {
        return "Strong build, good milk production potential, disease resistance from " + 
               animal1.getName() + " and " + animal2.getName();
    }
    
    private String findUnsuitableAnimals(List<AIAnalysisResponse> analyses) {
        List<String> unsuitable = new ArrayList<>();
        for (int i = 0; i < analyses.size(); i++) {
            if (analyses.get(i).getBreedingScore() < 60) {
                unsuitable.add("Animal " + (i + 1) + ": " + analyses.get(i).getRecommendations());
            }
        }
        return String.join("; ", unsuitable);
    }
    
    private String buildCombinedAnalysisData(List<AIAnalysisResponse> analyses) {
        StringBuilder combined = new StringBuilder();
        for (int i = 0; i < analyses.size(); i++) {
            combined.append("Animal ").append(i + 1).append(": ")
                   .append(analyses.get(i).toString()).append("\n");
        }
        return combined.toString();
    }
    
    private Integer calculateDiversityScore(List<Animal> animals) {
        long uniqueBreeds = animals.stream().map(Animal::getBreed).distinct().count();
        return (int) ((uniqueBreeds * 100.0) / animals.size());
    }
    
    private String formatBestPairs(List<BreedingRecommendation> recommendations) {
        return recommendations.stream()
            .map(rec -> rec.getAnimal1Name() + " + " + rec.getAnimal2Name() + 
                       " (" + rec.getCompatibilityScore() + "%)")
            .reduce((a, b) -> a + "; " + b)
            .orElse("No suitable pairs found");
    }
    
    private BreedingBoxResponse buildBreedingBoxResponse(BreedingBox box, 
                                                        List<AIAnalysisResponse> analyses,
                                                        List<BreedingRecommendation> recommendations,
                                                        String unsuitable) {
        BreedingBoxResponse response = new BreedingBoxResponse();
        response.setBoxId(box.getId());
        response.setSessionName(box.getSessionName());
        response.setAnimalAnalysis(analyses);
        response.setBreedingPairs(recommendations);
        response.setUnsuitableAnimals(List.of(unsuitable.split(";")));
        response.setOverallDiversityScore(box.getDiversityScore());
        response.setGeneralRecommendations(box.getAiRecommendations());
        return response;
    }
    
    private Animal.HealthStatus parseHealthStatus(String status) {
        try {
            return Animal.HealthStatus.valueOf(status.toUpperCase());
        } catch (Exception e) {
            return Animal.HealthStatus.UNKNOWN;
        }
    }
    
    private Animal.BreedingStatus parseBreedingStatus(String status) {
        if (status.toLowerCase().contains("ready")) return Animal.BreedingStatus.READY;
        if (status.toLowerCase().contains("pregnant")) return Animal.BreedingStatus.PREGNANT;
        return Animal.BreedingStatus.NOT_READY;
    }
    
    private Animal.Gender parseGender(String animalType) {
        if (animalType == null) return Animal.Gender.UNKNOWN;
        return switch (animalType.toLowerCase()) {
            case "bull", "ram", "boar", "stallion" -> Animal.Gender.MALE;
            case "cow", "ewe", "sow", "mare" -> Animal.Gender.FEMALE;
            default -> Animal.Gender.UNKNOWN;
        };
    }
}