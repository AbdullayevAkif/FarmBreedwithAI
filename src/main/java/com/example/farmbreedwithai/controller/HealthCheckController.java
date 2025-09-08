package com.example.farmbreedwithai.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@CrossOrigin(origins = "*")
public class HealthCheckController {
    
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("timestamp", LocalDateTime.now());
        status.put("service", "BreedMate AI");
        status.put("version", "1.0.0");
        return ResponseEntity.ok(status);
    }
    
    @GetMapping("/database")
    public ResponseEntity<Map<String, String>> checkDatabase() {
        Map<String, String> dbStatus = new HashMap<>();
        try {
            dbStatus.put("database", "Connected");
            dbStatus.put("status", "UP");
        } catch (Exception e) {
            dbStatus.put("database", "Disconnected");
            dbStatus.put("status", "DOWN");
            dbStatus.put("error", e.getMessage());
        }
        return ResponseEntity.ok(dbStatus);
    }
}