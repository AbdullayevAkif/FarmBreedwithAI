package com.example.farmbreedwithai.repository;

import com.example.farmbreedwithai.entity.Animal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.util.List;

@Repository
public interface AnimalRepository extends JpaRepository<Animal, Long> {
    List<Animal> findByGender(Animal.Gender gender);
    List<Animal> findByBreedingStatus(Animal.BreedingStatus breedingStatus);
    List<Animal> findByTypeAndGender(String type, Animal.Gender gender);




@Query("SELECT X FROM Animal X WHERE  X.breedingStatus='READY' And X.gender= :gender And X.breedingScore > :minScore")
    List<Animal> findBreedingCandidates(@Param("gender") Animal.Gender gender, @Param("minScore") Integer minScore);

@Query("SELECT X FROM Animal X WHERE X.id in :ids order by X.breedingScore DESC ")
List<Animal> findByIdsOrderedByBreedingScore(@Param("ids") List<Long> ids);

}
