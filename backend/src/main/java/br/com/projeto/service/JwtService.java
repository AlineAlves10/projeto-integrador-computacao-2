package br.com.projeto.service;

import br.com.projeto.model.autenticacao.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

@Slf4j
@Service
public class JwtService {

    private final SecretKey chave;
    private final long expiracaoMinutos;

    public JwtService(@Value("${app.jwt.secret:}") String segredo,
                      @Value("${app.jwt.expiracao-minutos:480}") long expiracaoMinutos) {
        this.expiracaoMinutos = expiracaoMinutos;

        if (segredo == null || segredo.isBlank()) {
            // Sem segredo configurado: chave aleatória (os tokens deixam de valer quando a aplicação reinicia)
            byte[] aleatorio = new byte[32];
            new SecureRandom().nextBytes(aleatorio);
            this.chave = Keys.hmacShaKeyFor(aleatorio);
            log.warn("app.jwt.secret não configurado: usando chave temporária. Defina a variável JWT_SECRET (mín. 32 caracteres).");
        } else {
            byte[] bytes = segredo.getBytes(StandardCharsets.UTF_8);
            if (bytes.length < 32) {
                throw new IllegalStateException("app.jwt.secret deve ter pelo menos 32 caracteres.");
            }
            this.chave = Keys.hmacShaKeyFor(bytes);
        }
    }

    public String gerarToken(Usuario usuario) {
        Instant agora = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(usuario.getId()))
                .claim("tipo", usuario.getTipo().name())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(calcularExpiracao(agora)))
                .signWith(chave)
                .compact();
    }

    public Instant calcularExpiracao(Instant emissao) {
        return emissao.plus(expiracaoMinutos, ChronoUnit.MINUTES);
    }

    // Retorna as claims de um token válido (assinatura e expiração conferidas) ou vazio
    public Optional<Claims> validar(String token) {
        try {
            return Optional.of(Jwts.parser().verifyWith(chave).build().parseSignedClaims(token).getPayload());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
