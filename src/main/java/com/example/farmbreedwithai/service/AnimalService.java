package com.example.farmbreedwithai.service;

import com.example.farmbreedwithai.entity.Animal;
import com.example.farmbreedwithai.repository.AnimalRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnimalService {
    private final AnimalRepository animalRepository;


    public AnimalService(AnimalRepository animalRepository) {
        this.animalRepository = animalRepository;
    }

    public List<Animal> getAllAnimals() {
        return animalRepository.findAll();
    }
    public Animal getAnimalById(Long id) {
        return animalRepository.getReferenceById(id);
    }

    public Animal saveAnimal(Animal animal) {
        return animalRepository.save(animal);
    }

    public String deleteAnimalById(Long id) {
        Animal animal = animalRepository.getReferenceById(id);
        animalRepository.delete(animal);
        return "Animal deleted: {" + animal.toString()+"}";
    }

    public List<Animal> getBreedingCandidates(Animal.Gender gender, Integer minScore) {
        return animalRepository.findBreedingCandidates(gender, minScore);
    }

    public List<Animal> getAnimalsByGender(Animal.Gender gender) {
       return animalRepository.findByGender(gender);
    }

    public List<Animal> getReadyAnimals() {
       return animalRepository.findByBreedingStatus(Animal.BreedingStatus.READY);
    }

}
