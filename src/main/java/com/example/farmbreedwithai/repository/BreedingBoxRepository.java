package com.example.farmbreedwithai.repository;

import com.example.farmbreedwithai.entity.BreedingBox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BreedingBoxRepository extends JpaRepository<BreedingBox, Long> {
    List<BreedingBox> findAllByOrderByCreatedAtDesc();
}