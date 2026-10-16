package br.com.projeto.service;

import br.com.projeto.dto.request.DiarioRequest;
import br.com.projeto.exception.AcessoNegadoException;
import br.com.projeto.exception.RegistroNaoEncontradoException;
import br.com.projeto.model.autenticacao.Bebe;
import br.com.projeto.model.diario.DiarioNotas;
import br.com.projeto.repository.DiarioNotasRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// Diário do bebê: qualquer usuário vinculado lê e escreve; apenas o autor edita ou exclui a própria anotação.
@Service
@RequiredArgsConstructor
@Transactional
public class DiarioService {

    private final AcessoBebeService acesso;
    private final DiarioNotasRepository diarioRepository;

    @Transactional(readOnly = true)
    public List<DiarioNotas> listar(Long bebeId) {
        acesso.verificarAcesso(bebeId);
        return diarioRepository.findByBebeIdOrderByDataHoraDescIdDesc(bebeId);
    }

    public DiarioNotas criar(Long bebeId, DiarioRequest request) {
        Bebe bebe = acesso.bebeAutorizado(bebeId);
        DiarioNotas nota = new DiarioNotas();
        nota.setBebe(bebe);
        nota.setAutor(acesso.usuarioLogado());
        aplicar(nota, request);
        return diarioRepository.save(nota);
    }

    public DiarioNotas atualizar(Long bebeId, Long notaId, DiarioRequest request) {
        DiarioNotas nota = buscarDoAutor(bebeId, notaId);
        aplicar(nota, request);
        nota.setAtualizadoEm(LocalDateTime.now());
        return nota;
    }

    public void excluir(Long bebeId, Long notaId) {
        diarioRepository.delete(buscarDoAutor(bebeId, notaId));
    }

    private DiarioNotas buscarDoAutor(Long bebeId, Long notaId) {
        acesso.verificarAcesso(bebeId);
        DiarioNotas nota = diarioRepository.findByIdAndBebeId(notaId, bebeId)
                .orElseThrow(() -> new RegistroNaoEncontradoException("Anotação não encontrada para este bebê."));
        if (nota.getAutor() == null || !nota.getAutor().getId().equals(acesso.usuarioLogadoId())) {
            throw new AcessoNegadoException("Apenas quem escreveu a anotação pode alterá-la ou excluí-la.");
        }
        return nota;
    }

    private void aplicar(DiarioNotas nota, DiarioRequest request) {
        LocalDateTime dataHora = request.dataHora() != null ? request.dataHora()
                : (nota.getDataHora() != null ? nota.getDataHora() : LocalDateTime.now());
        PeriodoConsulta.validarNaoFuturo(dataHora);
        nota.setDataHora(dataHora);
        nota.setTitulo(request.titulo().trim());
        nota.setTexto(request.texto().trim());
        nota.setTag(request.tag());
    }
}
