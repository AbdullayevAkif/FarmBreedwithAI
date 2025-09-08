package com.example.farmbreedwithai.controller;

import com.example.farmbreedwithai.entity.BreedingSchedule;
import com.example.farmbreedwithai.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ScheduleController {
    
    private final ScheduleService scheduleService;
    
    @GetMapping("/upcoming")
    public ResponseEntity<List<BreedingSchedule>> getUpcomingTasks() {
        return ResponseEntity.ok(scheduleService.getUpcomingTasks());
    }
    
    @GetMapping("/week")
    public ResponseEntity<List<BreedingSchedule>> getWeeklySchedule() {
        LocalDate start = LocalDate.now();
        LocalDate end = start.plusDays(7);
        return ResponseEntity.ok(scheduleService.getScheduleBetween(start, end));
    }
    
    @PostMapping("/create")
    public ResponseEntity<BreedingSchedule> createScheduleItem(@RequestBody BreedingSchedule schedule) {
        return ResponseEntity.ok(scheduleService.createScheduleItem(schedule));
    }
    
    @PutMapping("/{id}/complete")
    public ResponseEntity<BreedingSchedule> markComplete(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleService.markAsCompleted(id));
    }
}