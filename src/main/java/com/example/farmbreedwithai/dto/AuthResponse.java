package com.example.farmbreedwithai.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    private String token;
    private String type = "Bearer";
    private Long id;
    private String firstName;
    private String lastName;
      private String email;
    private String farmName;
    private String role;
    private Long expiresIn;
    
    public AuthResponse(String token, Long id, String firstName, String lastName, 
                       String email, String farmName, String role, Long expiresIn) {
        this.token = token;
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.farmName = farmName;
        this.role = role;
        this.expiresIn = expiresIn;
    }
}

