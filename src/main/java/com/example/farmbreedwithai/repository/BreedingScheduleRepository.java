package com.example.farmbreedwithai.repository;


import com.example.farmbreedwithai.entity.BreedingSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface BreedingScheduleRepository extends JpaRepository<BreedingSchedule, Long> {
    List<BreedingSchedule> findByScheduledDateBetween(LocalDate start, LocalDate end);
    List<BreedingSchedule> findByAnimalIdAndCompletedFalse(Long animalId);
    List<BreedingSchedule> findByCompletedFalseOrderByScheduledDate();
}