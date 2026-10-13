package com.babapremium.controller;

import com.babapremium.dto.PrevisaoSonoRequestDTO;
import com.babapremium.service.MlService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ia")
@CrossOrigin(origins = "http://localhost:3000")
public class IaController {

    private final MlService mlService;

    public IaController(MlService mlService) {
        this.mlService = mlService;
    }

    @PostMapping(value = "/prever-sono", produces = "application/json;charset=UTF-8")
    public ResponseEntity<String> preverSono(@RequestBody PrevisaoSonoRequestDTO dto) {
        String resultadoJson = mlService.executarPredicaoSono(dto);
        return ResponseEntity.ok(resultadoJson);
    }
}