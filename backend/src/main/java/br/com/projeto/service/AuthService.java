package br.com.projeto.service;

import br.com.projeto.Enum.TipoUsuarioEnum;
import br.com.projeto.dto.request.BebeRequest;
import br.com.projeto.dto.request.CadastroRequest;
import br.com.projeto.dto.request.LoginRequest;
import br.com.projeto.dto.response.BebeResponse;
import br.com.projeto.dto.response.CadastroResponse;
import br.com.projeto.dto.response.LoginResponse;
import br.com.projeto.exception.CredenciaisInvalidasException;
import br.com.projeto.exception.RegraNegocioException;
import br.com.projeto.mapper.BebeMapper;
import br.com.projeto.mapper.UsuarioMapper;
import br.com.projeto.model.autenticacao.Usuario;
import br.com.projeto.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final BebeService bebeService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioMapper usuarioMapper;
    private final BebeMapper bebeMapper;

    public LoginResponse login(LoginRequest request) {
        // Mesma mensagem para e-mail inexistente e senha errada (não revela quais e-mails existem)
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(UsuarioService.normalizarEmail(request.getEmail()))
                .filter(u -> passwordEncoder.matches(request.getSenha(), u.getSenha()))
                .orElseThrow(() -> new CredenciaisInvalidasException("E-mail ou senha inválidos."));
        return criarSessao(usuario);
    }

    // Conta + bebês em uma única transação: se qualquer bebê for inválido, nada é gravado
    @Transactional
    public CadastroResponse cadastrar(CadastroRequest request) {
        List<BebeRequest> bebes = request.bebes() == null ? List.of() : request.bebes();

        if (request.tipo() == TipoUsuarioEnum.RESPONSAVEL && bebes.isEmpty()) {
            throw new RegraNegocioException("Cadastre pelo menos um bebê.");
        }
        if (request.tipo() == TipoUsuarioEnum.BABA && !bebes.isEmpty()) {
            throw new RegraNegocioException("Babás cadastram bebês depois de entrar no sistema, informando o nome do responsável.");
        }

        Usuario usuario = usuarioService.criarConta(
                request.nome(), request.email(), request.senha(), request.telefone(), request.tipo());

        List<BebeResponse> criados = bebes.stream()
                .map(dados -> bebeMapper.map(bebeService.cadastrarBebe(bebeMapper.map(dados), usuario)))
                .toList();

        return new CadastroResponse(criarSessao(usuario), criados);
    }

    private LoginResponse criarSessao(Usuario usuario) {
        String token = jwtService.gerarToken(usuario);
        return new LoginResponse(token, "Bearer", jwtService.calcularExpiracao(Instant.now()),
                usuarioMapper.toResponse(usuario));
    }
}
