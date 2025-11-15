package com.example.farmbreedwithai.service;

import com.example.farmbreedwithai.entity.BreedingSchedule;
import com.example.farmbreedwithai.repository.BreedingScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleService {
    
    private final BreedingScheduleRepository scheduleRepository;
    
    public List<BreedingSchedule> getUpcomingTasks() {
        return scheduleRepository.findByCompletedFalseOrderByScheduledDate();
    }
    
    public List<BreedingSchedule> getScheduleBetween(LocalDate start, LocalDate end) {
        return scheduleRepository.findByScheduledDateBetween(start, end);
    }
    
    public BreedingSchedule createScheduleItem(BreedingSchedule schedule) {
        return scheduleRepository.save(schedule);
    }
    
    public BreedingSchedule markAsCompleted(Long id) {
        BreedingSchedule schedule = scheduleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Schedule item not found"));
        schedule.setCompleted(true);
        return scheduleRepository.save(schedule);
    }
    
    public BreedingSchedule update(Long id, BreedingSchedule incoming) {
        BreedingSchedule schedule = scheduleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Schedule item not found"));
        schedule.setTitle(incoming.getTitle());
        schedule.setType(incoming.getType());
        schedule.setDescription(incoming.getDescription());
        schedule.setSpecies(incoming.getSpecies());
        schedule.setScheduledDate(incoming.getScheduledDate());
        schedule.setNotes(incoming.getNotes());
        schedule.setReminderType(incoming.getReminderType());
        return scheduleRepository.save(schedule);
    }
    
    public void delete(Long id) {
        if (!scheduleRepository.existsById(id)) {
            throw new RuntimeException("Schedule item not found");
        }
        scheduleRepository.deleteById(id);
    }
    
    public List<BreedingSchedule> getAnimalSchedule(Long animalId) {
        return scheduleRepository.findByAnimalIdAndCompletedFalse(animalId);
    }
}