package com.example.farmbreedwithai.config;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "gemini")
@Data
@Getter
@Setter
public class GeminiConfig {
    private String apiUrl;
    private String apiKey;
    
    public String getApiUrl() {
        return apiUrl;
    }
    
    public String getApiKey() {
        return apiKey;
    }
}
