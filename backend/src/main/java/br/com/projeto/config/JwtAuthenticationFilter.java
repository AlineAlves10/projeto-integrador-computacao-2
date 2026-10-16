package br.com.projeto.config;

import br.com.projeto.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

// Lê o token "Authorization: Bearer ..." e, se válido, autentica a requisição com o id do usuário como principal.
// Token ausente ou inválido: a requisição segue sem autenticação e as rotas protegidas respondem 401.
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIXO = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String cabecalho = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (cabecalho != null && cabecalho.startsWith(PREFIXO)) {
            jwtService.validar(cabecalho.substring(PREFIXO.length())).ifPresent(claims -> {
                Long usuarioId = Long.valueOf(claims.getSubject());
                var autoridade = new SimpleGrantedAuthority("ROLE_" + claims.get("tipo", String.class));
                var autenticacao = new UsernamePasswordAuthenticationToken(usuarioId, null, List.of(autoridade));
                SecurityContextHolder.getContext().setAuthentication(autenticacao);
            });
        }

        filterChain.doFilter(request, response);
    }
}
