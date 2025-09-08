package com.example.farmbreedwithai.controller;

import com.example.farmbreedwithai.dto.QuestionResponse;
import com.example.farmbreedwithai.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-advisor")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AIAdvisorController {
    
    private final GeminiService geminiService;
    
    @PostMapping("/ask")
    public ResponseEntity<String> askBreedingQuestion(@RequestBody String question) {
        String response = geminiService.answerBreedingQuestion(question);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/voice-command")
    public ResponseEntity<String> processVoiceCommand(@RequestBody String voiceInput) {
        String prompt = "Convert this farmer's voice input into structured breeding data or action: " + voiceInput + 
                       ". Extract key breeding information and suggest next steps.";
        String response = geminiService.generateBreedingRecommendations(prompt);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/questions/{animalId}")
    public ResponseEntity<String> submitQuestionAnswers(@PathVariable Long animalId, 
                                                       @RequestBody QuestionResponse questionResponse) {
        String prompt = "Based on these farmer answers about animal " + animalId + ": " + 
                       questionResponse.getAnswer() + " for question: " + questionResponse.getQuestion() + 
                       ". Provide specific breeding recommendations and next steps.";
        String response = geminiService.answerBreedingQuestion(prompt);
        return ResponseEntity.ok(response);
    }
}