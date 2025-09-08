package com.example.farmbreedwithai.controller;


import com.example.farmbreedwithai.dto.AIAnalysisResponse;
import com.example.farmbreedwithai.service.PhotoAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FileUploadController {
    
    private final PhotoAnalysisService photoAnalysisService;
    
    @PostMapping("/analyze-image")
    public ResponseEntity<Map<String, Object>> uploadAndAnalyzeImage(@RequestParam("file") MultipartFile file,
                                                                    @RequestParam(value = "animalName", defaultValue = "Unknown") String animalName) {
        try {
            if (file.isEmpty()) {
                throw new IllegalArgumentException("File is empty");
            }
            
            if (!isValidImageFile(file)) {
                throw new IllegalArgumentException("Invalid image format. Supported: JPG, JPEG, PNG, WEBP");
            }
            
            String photoUrl = saveFile(file);
            byte[] imageBytes = file.getBytes();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            
            AIAnalysisResponse analysis = photoAnalysisService.analyzeAnimalPhoto(base64Image, animalName);
            
            Map<String, Object> response = new HashMap<>();
            response.put("analysis", analysis);
            response.put("photoUrl", photoUrl);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to process image: " + e.getMessage(), e);
        }
    }
    
    @PostMapping("/analyze-and-save/{animalId}")
    public ResponseEntity<AIAnalysisResponse> uploadAnalyzeAndSave(@PathVariable Long animalId,
                                                                  @RequestParam("file") MultipartFile file,
                                                                  @RequestParam(value = "animalName", defaultValue = "Unknown") String animalName) {
        try {
            byte[] imageBytes = file.getBytes();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            
            AIAnalysisResponse analysis = photoAnalysisService.analyzeAnimalPhoto(base64Image, animalName);
            photoAnalysisService.saveGeneticAnalysis(animalId, analysis, file.getOriginalFilename());
            
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            throw new RuntimeException("Failed to process and save image: " + e.getMessage(), e);
        }
    }
    
    private String saveFile(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            fileName = "image_" + System.currentTimeMillis() + ".jpg";
        }
        
        Path uploadPath = Paths.get("uploads");
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        return "http://localhost:8080/uploads/" + fileName;
    }
    
    private boolean isValidImageFile(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType != null && (
            contentType.equals("image/jpeg") ||
            contentType.equals("image/jpg") ||
            contentType.equals("image/png") ||
            contentType.equals("image/webp")
        );
    }
}