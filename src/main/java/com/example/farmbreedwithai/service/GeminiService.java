package com.example.farmbreedwithai.service;


import com.example.farmbreedwithai.config.GeminiConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiService {
    
    private final RestTemplate restTemplate;
    private final GeminiConfig geminiConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Cacheable(value = "photoAnalysis", key = "#imageData.hashCode()")
    public String analyzeAnimalPhoto(String imageData, String prompt) {
        try {
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody;
            if (imageData.startsWith("http")) {
                requestBody = createImageUrlAnalysisRequest(prompt, imageData);
            } else {
                requestBody = createImageAnalysisRequest(prompt, imageData);
            }
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            String url = geminiConfig.getApiUrl() + "?key=" + geminiConfig.getApiKey();
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            
            return extractTextFromGeminiResponse(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Failed to analyze image with Gemini: " + e.getMessage(), e);
        }
    }
    
    @Cacheable(value = "breedingQuestions", key = "#animalAnalysis.hashCode()")
    public String generateBreedingQuestions(String animalAnalysis) {
        try {
            String prompt = "Based on this animal analysis: " + animalAnalysis + 
                ". Generate 3-5 specific breeding-related questions that a farmer should answer. " +
                "Format as JSON array with 'question' and 'questionType' fields. " +
                "Questions should be practical and specific to breeding decisions.";
            
            Map<String, Object> requestBody = createTextRequest(prompt);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            String url = geminiConfig.getApiUrl() + "?key=" + geminiConfig.getApiKey();
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            
            return extractTextFromGeminiResponse(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate questions: " + e.getMessage(), e);
        }
    }
    
    @Cacheable(value = "breedingRecommendations", key = "#combinedAnimalData.hashCode()")
    public String generateBreedingRecommendations(String combinedAnimalData) {
        try {
            String prompt = "Analyze these farm animals for optimal breeding pairs: " + combinedAnimalData + 
                ". Provide detailed breeding recommendations in JSON format with: " +
                "1. Best breeding pairs with compatibility scores (0-100) " +
                "2. Animals unsuitable for breeding and reasons " +
                "3. Predicted offspring characteristics " +
                "4. Risk factors and warnings " +
                "5. Overall herd genetic diversity score " +
                "Be specific and practical for farmers.";
            
            Map<String, Object> requestBody = createTextRequest(prompt);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            String url = geminiConfig.getApiUrl() + "?key=" + geminiConfig.getApiKey();
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            return extractTextFromGeminiResponse(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate breeding recommendations: " + e.getMessage(), e);
        }
    }
    
    public String answerBreedingQuestion(String question) {
        try {
            String prompt = "You are an expert farm animal breeding advisor. " +
                "Answer this farmer's question with practical, actionable advice: " + question + 
                ". Keep responses concise but informative.";
            
            Map<String, Object> requestBody = createTextRequest(prompt);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            String url = geminiConfig.getApiUrl() + "?key=" + geminiConfig.getApiKey();
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            
            return extractTextFromGeminiResponse(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Failed to answer question: " + e.getMessage(), e);
        }
    }
    
    private Map<String, Object> createImageAnalysisRequest(String prompt, String base64Image) {
        Map<String, Object> request = new HashMap<>();
        
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);
        
        Map<String, Object> imagePart = new HashMap<>();
        Map<String, Object> inlineData = new HashMap<>();
        
        String mimeType = "image/jpeg";
        if (base64Image.startsWith("iVBORw0KGgo")) {
            mimeType = "image/png";
        } else if (base64Image.startsWith("/9j/")) {
            mimeType = "image/jpeg";
        } else if (base64Image.startsWith("UklGRg")) {
            mimeType = "image/webp";
        }
        
        inlineData.put("mimeType", mimeType);
        inlineData.put("data", base64Image);
        imagePart.put("inlineData", inlineData);
        
        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(textPart, imagePart));
        
        request.put("contents", List.of(content));
        return request;
    }
    
    private Map<String, Object> createImageUrlAnalysisRequest(String prompt, String imageUrl) {
        Map<String, Object> request = new HashMap<>();
        
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);
        
        Map<String, Object> imagePart = new HashMap<>();
        Map<String, Object> fileData = new HashMap<>();
        fileData.put("mimeType", "image/jpeg");
        fileData.put("fileUri", imageUrl);
        imagePart.put("fileData", fileData);
        
        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(textPart, imagePart));
        
        request.put("contents", List.of(content));
        return request;
    }
    
    private Map<String, Object> createTextRequest(String prompt) {
        Map<String, Object> request = new HashMap<>();
        
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);
        
        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(textPart));
        
        request.put("contents", List.of(content));
        return request;
    }
    
    private String extractTextFromGeminiResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.get("candidates");
            if (candidates != null && candidates.isArray() && candidates.size() > 0) {
                JsonNode content = candidates.get(0).get("content");
                if (content != null) {
                    JsonNode parts = content.get("parts");
                    if (parts != null && parts.isArray() && parts.size() > 0) {
                        JsonNode text = parts.get(0).get("text");
                        if (text != null) {
                            return text.asText();
                        }
                    }
                }
            }
            throw new RuntimeException("Invalid Gemini response format");
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini response: " + e.getMessage(), e);
        }
    }
}
