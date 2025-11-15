package com.example.farmbreedwithai.service;

import com.example.farmbreedwithai.dto.AIAnalysisResponse;
import com.example.farmbreedwithai.dto.BreedingQuestion;
import com.example.farmbreedwithai.entity.Animal;
import com.example.farmbreedwithai.entity.GeneticAnalysis;
import com.example.farmbreedwithai.dto.OffspringPrediction;
import com.example.farmbreedwithai.repository.AnimalRepository;
import com.example.farmbreedwithai.repository.GeneticAnalysisRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PhotoAnalysisService {
    
    private final GeminiService geminiService;
    private final BreedInfoService breedInfoService;
    private final AnimalRepository animalRepository;
    private final GeneticAnalysisRepository geneticAnalysisRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public AIAnalysisResponse analyzeAnimalPhoto(String imageData, String animalName) {
        String prompt = "Analyze this farm animal photo for breeding purposes. Provide a strict JSON object with these exact fields: " +
            "animalType (cattle/sheep/goat/pig), breed (specific breed name), " +
            "physicalCondition (poor/fair/good/excellent), estimatedAge (in years), " +
            "breedingReadiness (ready/not_ready/pregnant/too_young/too_old), " +
            "healthStatus (poor/fair/good/excellent), breedingScore (0-100), " +
            "traits (concise genetic traits summary), geneticsTraitsDetails (detailed breed-specific genetic markers, conformation, heritable traits), " +
            "recommendations (breeding advice), confidence (0.0-1.0), " +
            "color, size, weight, temperament, milkYield, meatScore, fertilityScore, notes. " +
            "Be specific and practical for farmers.";
        
        String aiResponse = geminiService.analyzeAnimalPhoto(imageData, prompt);
        AIAnalysisResponse parsed = parseAIResponse(aiResponse);
        if (parsed.getBreed() != null && !parsed.getBreed().isBlank()) {
            String summary = breedInfoService.fetchBreedSummary(parsed.getAnimalType(), parsed.getBreed());
            if (summary != null && !summary.isBlank()) {
                if (parsed.getNotes() == null || parsed.getNotes().isBlank()) {
                    parsed.setNotes(summary);
                } else {
                    parsed.setNotes(parsed.getNotes() + "\n\nBreed info: " + summary);
                }
            }
        }
        return parsed;
    }
    
    public List<BreedingQuestion> generateDynamicQuestions(AIAnalysisResponse analysis) {
        String questionsJson = geminiService.generateBreedingQuestions(analysis.toString());
        return parseBreedingQuestions(questionsJson);
    }

    public OffspringPrediction getOffspringPrediction(AIAnalysisResponse femaleAnalysis, AIAnalysisResponse maleAnalysis) {
        String ebeveynlerJson = createParentJson(femaleAnalysis, maleAnalysis);
        String yavruPrompt = "Based on the following two parent animals' analysis (Female: " + femaleAnalysis.getBreed() + ", Male: " + maleAnalysis.getBreed() + "), calculate the predicted fields for the resulting crossbred offspring. You must search external breed information to estimate the average characteristics of this specific cross (X*Y crossbred). Provide a strict JSON object with these exact fields: " +
            "predictedBreed, predictedScore, expectedSize, expectedWeight, expectedColor, expectedTemperament, " +
            "predictedWoolYield, predictedMeatScore, inheritableHealthRisks, breedingRecommendation, notes. " +
            "Focus on giving the most likely closest indicators based on the provided parent scores and breed averages.";
        String aiResponse = geminiService.performMelezAnalysis(ebeveynlerJson, yavruPrompt);
        return parseOffspringPrediction(aiResponse);
    }
    
    private AIAnalysisResponse parseAIResponse(String jsonResponse) {
        try {
            String cleanJson = extractJsonFromText(jsonResponse);
            JsonNode node = objectMapper.readTree(cleanJson);
            
            AIAnalysisResponse response = new AIAnalysisResponse();
            response.setAnimalType(getStringValue(node, "animalType", "cattle"));
            response.setBreed(getStringValue(node, "breed", "unknown"));
            response.setPhysicalCondition(getStringValue(node, "physicalCondition", "good"));
            response.setEstimatedAge(getIntValue(node, "estimatedAge", 3));
            response.setBreedingReadiness(getStringValue(node, "breedingReadiness", "ready"));
            response.setHealthStatus(getStringValue(node, "healthStatus", "good"));
            response.setBreedingScore(getIntValue(node, "breedingScore", 75));
            response.setTraits(getStringValue(node, "traits", "standard traits"));
            response.setRecommendations(getStringValue(node, "recommendations", "suitable for breeding"));
            response.setConfidence(getDoubleValue(node, "confidence", 0.8));
            response.setColor(getStringValue(node, "color", null));
            response.setSize(getStringValue(node, "size", null));
            response.setGeneticsTraitsDetails(getStringValue(node, "geneticsTraitsDetails", null));
            Double weightVal = null;
            JsonNode weightNode = node.get("weight");
            if (weightNode != null && weightNode.isNumber()) {
                weightVal = weightNode.asDouble();
            }
            response.setWeight(weightVal);
            response.setTemperament(getStringValue(node, "temperament", null));
            JsonNode milkNode = node.get("milkYield");
            if (milkNode != null && milkNode.isNumber()) {
                response.setMilkYield(milkNode.asDouble());
            }
            JsonNode meatNode = node.get("meatScore");
            if (meatNode != null && meatNode.isInt()) {
                response.setMeatScore(meatNode.asInt());
            }
            JsonNode fertNode = node.get("fertilityScore");
            if (fertNode != null && fertNode.isInt()) {
                response.setFertilityScore(fertNode.asInt());
            }
            response.setNotes(getStringValue(node, "notes", null));
            
            return response;
        } catch (Exception e) {
            return createDefaultResponse();
        }
    }
    
    private List<BreedingQuestion> parseBreedingQuestions(String jsonResponse) {
        try {
            String cleanJson = extractJsonFromText(jsonResponse);
            JsonNode questionsArray = objectMapper.readTree(cleanJson);
            List<BreedingQuestion> questions = new ArrayList<>();
            
            if (questionsArray.isArray()) {
                for (JsonNode questionNode : questionsArray) {
                    BreedingQuestion question = new BreedingQuestion();
                    question.setQuestion(getStringValue(questionNode, "question", "General breeding question"));
                    question.setQuestionType(getStringValue(questionNode, "questionType", "general"));
                    question.setRequired(getBooleanValue(questionNode, "required", true));
                    questions.add(question);
                }
            }
            
            if (questions.isEmpty()) {
                questions.addAll(createDefaultQuestions());
            }
            
            return questions;
        } catch (Exception e) {
            return createDefaultQuestions();
        }
    }

    private String createParentJson(AIAnalysisResponse femaleAnalysis, AIAnalysisResponse maleAnalysis) {
        try {
            return objectMapper.writeValueAsString(List.of(femaleAnalysis, maleAnalysis));
        } catch (Exception e) {
            return "{}";
        }
    }

    private OffspringPrediction parseOffspringPrediction(String jsonResponse) {
        try {
            String cleanJson = extractJsonFromText(jsonResponse);
            JsonNode node = objectMapper.readTree(cleanJson);
            OffspringPrediction response = new OffspringPrediction();
            response.setPredictedBreed(getStringValue(node, "predictedBreed", "Crossbred"));
            response.setPredictedScore(getIntValue(node, "predictedScore", 70));
            response.setExpectedSize(getStringValue(node, "expectedSize", "Medium"));
            response.setExpectedWeight(Double.valueOf(getStringValue(node, "expectedWeight", "40 kg")));
            response.setExpectedColor(getStringValue(node, "expectedColor", "Mixed"));
            response.setExpectedTemperament(getStringValue(node, "expectedTemperament", "Docile"));
            response.setPredictedWoolYield(getStringValue(node, "predictedWoolYield", "Average"));
            response.setPredictedMeatScore(Integer.valueOf(getStringValue(node, "predictedMeatScore", "6")));
            response.setInheritableHealthRisks(getStringValue(node, "inheritableHealthRisks", "Low risk"));
            response.setBreedingRecommendation(getStringValue(node, "breedingRecommendation", "Recommended pair"));
            response.setNotes(getStringValue(node, "notes", null));
            return response;
        } catch (Exception e) {
            OffspringPrediction defaultResponse = new OffspringPrediction();
            defaultResponse.setBreedingRecommendation("Could not generate detailed crossbred analysis due to AI error.");
            return defaultResponse;
        }
    }
    
    private String extractJsonFromText(String text) {
        if (text.contains("{")) {
            int start = text.indexOf("{");
            int end = text.lastIndexOf("}") + 1;
            if (end > start) {
                return text.substring(start, end);
            }
        }
        return text;
    }
    
    private String getStringValue(JsonNode node, String fieldName, String defaultValue) {
        JsonNode field = node.get(fieldName);
        return field != null ? field.asText(defaultValue) : defaultValue;
    }
    
    private Integer getIntValue(JsonNode node, String fieldName, Integer defaultValue) {
        JsonNode field = node.get(fieldName);
        return field != null ? field.asInt(defaultValue) : defaultValue;
    }
    
    private Double getDoubleValue(JsonNode node, String fieldName, Double defaultValue) {
        JsonNode field = node.get(fieldName);
        return field != null ? field.asDouble(defaultValue) : defaultValue;
    }
    
    private Boolean getBooleanValue(JsonNode node, String fieldName, Boolean defaultValue) {
        JsonNode field = node.get(fieldName);
        return field != null ? field.asBoolean(defaultValue) : defaultValue;
    }
    
    private AIAnalysisResponse createDefaultResponse() {
        AIAnalysisResponse response = new AIAnalysisResponse();
        response.setAnimalType("cattle");
        response.setBreed("mixed");
        response.setPhysicalCondition("good");
        response.setEstimatedAge(3);
        response.setBreedingReadiness("ready");
        response.setHealthStatus("good");
        response.setBreedingScore(75);
        response.setTraits("standard breeding traits");
        response.setRecommendations("suitable for breeding with proper care");
        response.setConfidence(0.7);
        return response;
    }
    
    private List<BreedingQuestion> createDefaultQuestions() {
        List<BreedingQuestion> questions = new ArrayList<>();
        questions.add(new BreedingQuestion("Has this animal bred before?", "history", true));
        questions.add(new BreedingQuestion("How many offspring has it had?", "performance", true));
        questions.add(new BreedingQuestion("Any recent health issues?", "health", true));
        questions.add(new BreedingQuestion("What is the animal's temperament?", "behavior", false));
        return questions;
    }
    
    public void saveGeneticAnalysis(Long animalId, AIAnalysisResponse analysis, String photoUrl) {
        Animal animal = animalRepository.findById(animalId)
            .orElseThrow(() -> new RuntimeException("Animal not found with id: " + animalId));
        
        GeneticAnalysis geneticAnalysis = new GeneticAnalysis();
        geneticAnalysis.setAnimal(animal);
        geneticAnalysis.setPhotoUrl(photoUrl);
        geneticAnalysis.setOverallScore(analysis.getBreedingScore());
        geneticAnalysis.setPhysicalTraits(analysis.getTraits());
        geneticAnalysis.setHealthIndicators(analysis.getHealthStatus());
        geneticAnalysis.setBreedingPotential(analysis.getBreedingReadiness());
        geneticAnalysis.setAiAnalysisResult(analysis.getRecommendations());
        geneticAnalysis.setConfidenceScore(analysis.getConfidence());
        
        geneticAnalysisRepository.save(geneticAnalysis);
        
        animal.setBreedingScore(analysis.getBreedingScore());
        animal.setGeneticsTraits(analysis.getTraits());
        animal.setHealthStatus(parseHealthStatus(analysis.getHealthStatus()));
        animal.setBreedingStatus(parseBreedingStatus(analysis.getBreedingReadiness()));
        animalRepository.save(animal);
    }
    
    private Animal.HealthStatus parseHealthStatus(String status) {
        try {
            return Animal.HealthStatus.valueOf(status.toUpperCase());
        } catch (Exception e) {
            return Animal.HealthStatus.GOOD;
        }
    }
    
    private Animal.BreedingStatus parseBreedingStatus(String status) {
        if (status.toLowerCase().contains("ready")) return Animal.BreedingStatus.READY;
        if (status.toLowerCase().contains("pregnant")) return Animal.BreedingStatus.PREGNANT;
        if (status.toLowerCase().contains("breeding")) return Animal.BreedingStatus.BREEDING;
        return Animal.BreedingStatus.NOT_READY;
    }
}
