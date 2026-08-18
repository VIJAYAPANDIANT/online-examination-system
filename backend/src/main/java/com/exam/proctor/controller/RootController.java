package com.exam.proctor.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class RootController {

    @GetMapping("/")
    public Map<String, String> healthCheck() {
        return Map.of(
            "status", "UP",
            "message", "Online Examination System Backend is running successfully!"
        );
    }
}
