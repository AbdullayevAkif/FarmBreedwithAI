package com.example.farmbreedwithai.controller;

import com.example.farmbreedwithai.entity.BreedingSchedule;
import com.example.farmbreedwithai.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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
    public ResponseEntity<BreedingSchedule> createScheduleItem(@RequestBody Map<String, Object> body) {
        BreedingSchedule s = new BreedingSchedule();
        s.setTitle((String) body.getOrDefault("title", null));
        s.setType((String) body.getOrDefault("type", null));
        s.setDescription((String) body.getOrDefault("description", null));
        Object md = body.get("metadata");
        if (md instanceof Map) {
            Object sp = ((Map<?,?>) md).get("species");
            if (sp != null) s.setSpecies(String.valueOf(sp));
        }
        if (body.get("species") != null) s.setSpecies(String.valueOf(body.get("species")));
        Object dateObj = body.get("scheduledDate");
        if (dateObj != null) {
            String iso = String.valueOf(dateObj);
            String d = iso.length() >= 10 ? iso.substring(0, 10) : iso;
            s.setScheduledDate(LocalDate.parse(d));
        }
        return ResponseEntity.ok(scheduleService.createScheduleItem(s));
    }
    
    @PutMapping("/{id}/complete")
    public ResponseEntity<BreedingSchedule> markComplete(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleService.markAsCompleted(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BreedingSchedule> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        BreedingSchedule s = new BreedingSchedule();
        s.setTitle((String) body.getOrDefault("title", null));
        s.setType((String) body.getOrDefault("type", null));
        s.setDescription((String) body.getOrDefault("description", null));
        Object md = body.get("metadata");
        if (md instanceof Map) {
            Object sp = ((Map<?,?>) md).get("species");
            if (sp != null) s.setSpecies(String.valueOf(sp));
        }
        if (body.get("species") != null) s.setSpecies(String.valueOf(body.get("species")));
        Object dateObj = body.get("scheduledDate");
        if (dateObj != null) {
            String iso = String.valueOf(dateObj);
            String d = iso.length() >= 10 ? iso.substring(0, 10) : iso;
            s.setScheduledDate(LocalDate.parse(d));
        }
        return ResponseEntity.ok(scheduleService.update(id, s));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        scheduleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/create-hatching")
    public ResponseEntity<BreedingSchedule> createHatching(@RequestBody Map<String, Object> body) {
        String species = body.get("species") != null ? String.valueOf(body.get("species")) : null;
        String title = body.get("title") != null ? String.valueOf(body.get("title")) : null;
        String description = body.get("description") != null ? String.valueOf(body.get("description")) : null;
        if (species == null || species.isBlank()) {
            throw new RuntimeException("species required");
        }
        String sp = species.toLowerCase();
        boolean isBird = switch (sp) {
            case "chicken", "duck", "turkey", "goose", "quail", "pheasant" -> true;
            default -> false;
        };
        int days = switch (sp) {
            case "chicken" -> 21;
            case "duck" -> 28;
            case "turkey" -> 30;
            case "goose" -> 28;
            case "quail" -> 17;
            case "pheasant" -> 24;
            case "cattle", "cow", "bull" -> 283;
            case "sheep" -> 152;
            case "goat" -> 150;
            case "pig" -> 115;
            case "horse" -> 336;
            case "donkey" -> 365;
            case "rabbit" -> 31;
            case "llama" -> 350;
            case "alpaca" -> 345;
            case "bee" -> 21;
            default -> 21;
        };
        LocalDate start = LocalDate.now();
        LocalDate due = start.plusDays(days);
        BreedingSchedule s = new BreedingSchedule();
        s.setTitle(title != null && !title.isBlank() ? title : ((isBird ? "Hatching expected: " : "Birth expected: ") + species));
        s.setType(isBird ? "HATCHING" : "PREGNANCY");
        s.setDescription(description);
        s.setSpecies(species);
        s.setDurationDays(days);
        s.setStartDate(start);
        s.setScheduledDate(due);
        return ResponseEntity.ok(scheduleService.createScheduleItem(s));
    }
}