package com.example.farmbreedwithai.repository;

import com.example.farmbreedwithai.entity.Animal;
import com.example.farmbreedwithai.entity.GeneticAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GeneticAnalysisRepository extends JpaRepository<GeneticAnalysis, Long> {

    List<GeneticAnalysis> findByAnimalIdOrderByAnalyzedAtDesc(Long animalId);
    Optional<GeneticAnalysis> findTopByAnimalIdOrderByAnalyzedAtDesc(Long animalId);

}


