package br.com.projeto.service;

import br.com.projeto.Enum.TipoUsuarioEnum;
import br.com.projeto.exception.EmailJaCadastradoException;
import br.com.projeto.exception.RegraNegocioException;
import br.com.projeto.exception.UsuarioNaoEncontradoException;
import br.com.projeto.model.autenticacao.Usuario;
import br.com.projeto.model.autenticacao.UsuarioBebe;
import br.com.projeto.repository.UsuarioBebeRepository;
import br.com.projeto.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioBebeRepository usuarioBebeRepository;
    private final PasswordEncoder passwordEncoder;

    //cadastrarUsuario()
    public Usuario cadastrarUsuario(Usuario usuario){
        if (usuario.getTipo() == null) {
            throw new RegraNegocioException("Informe o tipo de usuário (RESPONSAVEL ou BABA).");
        }
        usuario.setId(null); // sempre uma conta nova; nunca sobrescreve uma existente
        usuario.setEmail(normalizarEmail(usuario.getEmail()));
        usuario.setTelefone(Telefone.normalizar(usuario.getTelefone()));
        if (usuarioRepository.existsByEmailIgnoreCase(usuario.getEmail())) {
            throw new EmailJaCadastradoException("Este e-mail já está cadastrado.");
        }
        // A senha nunca é gravada em texto puro
        usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
        if (usuario.getDataCadastro() == null) {
            usuario.setDataCadastro(LocalDate.now());
        }
        usuarioRepository.save(usuario);
        return usuario;
    }

    public Usuario criarConta(String nome, String email, String senha, String telefone, TipoUsuarioEnum tipo) {
        Usuario usuario = new Usuario();
        usuario.setNome(nome.trim());
        usuario.setEmail(email);
        usuario.setSenha(senha);
        usuario.setTelefone(telefone);
        usuario.setTipo(tipo);
        return cadastrarUsuario(usuario);
    }

    @Transactional
    public Usuario atualizarTelefone(Long id, String telefone) {
        Usuario usuario = obterUsuario(id);
        usuario.setTelefone(Telefone.normalizar(telefone));
        return usuario;
    }

    // Dados de outro usuário: só nome e tipo; o telefone aparece apenas quando a regra de contato permite
    // (ver UsuarioBebeRepository.podeVerTelefone). E-mail e foto de outras pessoas não são expostos.
    public boolean podeVerTelefone(Long visualizadorId, Long alvoId) {
        return visualizadorId.equals(alvoId) || usuarioBebeRepository.podeVerTelefone(visualizadorId, alvoId);
    }

    // Excluir a conta remove todos os vínculos dela (cascade). Mesma regra de sair de um bebê
    // (UsuarioBebeService): o único responsável não sai enquanto houver outras pessoas vinculadas,
    // senão a babá passaria a gerenciar o bebê sem que nenhum responsável tenha autorizado.
    @Transactional
    public void deletarUsuario(Long id){
        Usuario usuario = obterUsuario(id);
        for (UsuarioBebe vinculo : usuarioBebeRepository.findByUsuarioIdComBebe(id)) {
            Long bebeId = vinculo.getId().getBebeId();
            if (vinculo.getPapel() == TipoUsuarioEnum.RESPONSAVEL
                    && usuarioBebeRepository.countByBebeIdAndPapel(bebeId, TipoUsuarioEnum.RESPONSAVEL) <= 1
                    && usuarioBebeRepository.countByBebeId(bebeId) > 1) {
                throw new RegraNegocioException("Você é o único responsável por " + vinculo.getBebe().getNome()
                        + ". Vincule outro responsável ou remova as demais pessoas antes de excluir a conta.");
            }
        }
        usuarioRepository.delete(usuario);
    }

    //obterUsuario()
    public Usuario obterUsuario(Long id){
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));
    }

    // Usuários que compartilham bebês com o usuário informado (e ele mesmo)
    public List<Usuario> listarRelacionados(Long usuarioId) {
        return usuarioRepository.findUsuariosRelacionados(usuarioId);
    }

    public static String normalizarEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
