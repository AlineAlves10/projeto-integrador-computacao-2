package br.com.projeto.controller;

import br.com.projeto.dto.request.CadastroRequest;
import br.com.projeto.dto.request.LoginRequest;
import br.com.projeto.dto.response.CadastroResponse;
import br.com.projeto.dto.response.LoginResponse;
import br.com.projeto.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // Cria a conta e (para responsáveis) todos os bebês informados em uma única transação
    @PostMapping("/cadastro")
    public ResponseEntity<CadastroResponse> cadastrar(@RequestBody @Valid CadastroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.cadastrar(request));
    }
}
