package com.example.farmbreedwithai.repository;

import com.example.farmbreedwithai.entity.BreedingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BreedingRecordRepository extends JpaRepository<BreedingRecord, Long> {

    List<BreedingRecord> findByAnimalId(Long animalId);
    List<BreedingRecord> findByBreedingResult(BreedingRecord.BreedingResult breedingResult);


    @Query("SELECT X FROM BreedingRecord X WHERE  X.animal.id = :animalId And X.mate.id =  :animalId order by X.breedingDate  DESC ")
    List<BreedingRecord> findBreedingHistoryByAnimal(@Param("animalId") Long animalId);
}
