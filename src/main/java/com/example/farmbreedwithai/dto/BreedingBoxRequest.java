package com.example.farmbreedwithai.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BreedingBoxRequest {
    private String sessionName;
    private List<PhotoAnalysisRequest> animalPhotos;
}