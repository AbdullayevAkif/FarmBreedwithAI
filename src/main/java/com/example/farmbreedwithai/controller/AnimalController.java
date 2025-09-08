package com.example.farmbreedwithai.controller;

import com.example.farmbreedwithai.dto.AIAnalysisResponse;
import com.example.farmbreedwithai.dto.PhotoAnalysisRequest;
import com.example.farmbreedwithai.entity.Animal;
import com.example.farmbreedwithai.service.AnimalService;
import com.example.farmbreedwithai.service.PhotoAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/animals")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnimalController {

    private final AnimalService animalService;
    private final PhotoAnalysisService photoAnalysisService;

    @GetMapping
    public ResponseEntity<List<Animal>> getAllAnimals() {
        return ResponseEntity.ok(animalService.getAllAnimals());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Animal> getAnimalById(@PathVariable Long id) {
        Animal animal = animalService.getAnimalById(id);
        if (animal != null) {
            return ResponseEntity.ok(animal);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Animal> createAnimal(@RequestBody Animal animal) {
        return ResponseEntity.ok(animalService.saveAnimal(animal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Animal> updateAnimal(@PathVariable Long id, @RequestBody Animal animal) {
        Animal existingAnimal = animalService.getAnimalById(id);
        if (existingAnimal != null) {
            animal.setId(id);
            return ResponseEntity.ok(animalService.saveAnimal(animal));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnimal(@PathVariable Long id) {
        animalService.deleteAnimalById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/analyze-photo")
    public ResponseEntity<AIAnalysisResponse> analyzePhoto(@RequestBody PhotoAnalysisRequest request) {
        AIAnalysisResponse analysis = photoAnalysisService.analyzeAnimalPhoto(
                request.getPhotoBase64(), request.getAnimalName());
        return ResponseEntity.ok(analysis);
    }

    @PostMapping("/{id}/analyze-and-save")
    public ResponseEntity<AIAnalysisResponse> analyzeAndSavePhoto(@PathVariable Long id,
                                                                  @RequestBody PhotoAnalysisRequest request) {
        AIAnalysisResponse analysis = photoAnalysisService.analyzeAnimalPhoto(
                request.getPhotoBase64(), request.getAnimalName());
        photoAnalysisService.saveGeneticAnalysis(id, analysis, "photo_url_here");
        return ResponseEntity.ok(analysis);
    }

    @GetMapping("/breeding-candidates")
    public ResponseEntity<List<Animal>> getBreedingCandidates(@RequestParam Animal.Gender gender,
                                                              @RequestParam(defaultValue = "70") Integer minScore) {
        return ResponseEntity.ok(animalService.getBreedingCandidates(gender, minScore));
    }
}
