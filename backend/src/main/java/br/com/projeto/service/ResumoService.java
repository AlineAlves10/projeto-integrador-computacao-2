package br.com.projeto.service;

import br.com.projeto.Enum.StatusHorarioPrevistoEnum;
import br.com.projeto.Enum.TipoAlimentacaoEnum;
import br.com.projeto.Enum.TipoFraldaEnum;
import br.com.projeto.Enum.TipoLeiteEnum;
import br.com.projeto.dto.response.EstatisticasResponse;
import br.com.projeto.dto.response.LinhaDoTempoItemResponse;
import br.com.projeto.dto.response.ResumoDiaResponse;
import br.com.projeto.mapper.DiarioMapper;
import br.com.projeto.model.cuidados.RegistroFralda;
import br.com.projeto.model.cuidados.RegistroHigiene;
import br.com.projeto.model.rotina.RegistroAlimentacao;
import br.com.projeto.model.rotina.RegistroAtividade;
import br.com.projeto.model.rotina.RegistroSono;
import br.com.projeto.model.saude.RegistroMedicamento;
import br.com.projeto.repository.DiarioNotasRepository;
import br.com.projeto.repository.HorarioPrevistoRepository;
import br.com.projeto.repository.RegistroAlimentacaoRepository;
import br.com.projeto.repository.RegistroAtividadeRepository;
import br.com.projeto.repository.RegistroFraldaRepository;
import br.com.projeto.repository.RegistroHigieneRepository;
import br.com.projeto.repository.RegistroMedicamentoRepository;
import br.com.projeto.repository.RegistroSonoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

// Visões consolidadas montadas a partir dos registros persistidos (nenhum valor é fixo ou estimado).
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResumoService {

    private static final int LIMITE_PROXIMOS = 5;

    private final AcessoBebeService acesso;
    private final RegistroAlimentacaoRepository alimentacaoRepository;
    private final RegistroSonoRepository sonoRepository;
    private final RegistroFraldaRepository fraldaRepository;
    private final RegistroHigieneRepository higieneRepository;
    private final RegistroAtividadeRepository atividadeRepository;
    private final RegistroMedicamentoRepository medicamentoRepository;
    private final HorarioPrevistoRepository horarioRepository;
    private final DiarioNotasRepository diarioRepository;
    private final DiarioMapper diarioMapper;

    // Registros de um período, carregados uma única vez por consulta
    private record Registros(List<RegistroAlimentacao> alimentacoes, List<RegistroSono> sonos,
                             List<RegistroFralda> fraldas, List<RegistroHigiene> higienes,
                             List<RegistroAtividade> atividades, List<RegistroMedicamento> medicamentos) {

        int total() {
            return alimentacoes.size() + sonos.size() + fraldas.size() + higienes.size()
                    + atividades.size() + medicamentos.size();
        }
    }

    private Registros carregar(Long bebeId, PeriodoConsulta p) {
        LocalDateTime i = p.inicio();
        LocalDateTime f = p.fimExclusivo();
        return new Registros(
                alimentacaoRepository.findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(bebeId, i, f),
                sonoRepository.findByBebeIdAndInicioGreaterThanEqualAndInicioLessThanOrderByInicio(bebeId, i, f),
                fraldaRepository.findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(bebeId, i, f),
                higieneRepository.findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(bebeId, i, f),
                atividadeRepository.findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(bebeId, i, f),
                medicamentoRepository.findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(bebeId, i, f));
    }

    // ---------- Linha do tempo ----------

    public List<LinhaDoTempoItemResponse> linhaDoTempo(Long bebeId, PeriodoConsulta periodo) {
        acesso.verificarAcesso(bebeId);
        Registros r = carregar(bebeId, periodo);
        List<LinhaDoTempoItemResponse> itens = new ArrayList<>();

        r.alimentacoes().forEach(a -> itens.add(new LinhaDoTempoItemResponse("ALIMENTACAO", a.getId(), a.getTipo().name(),
                a.getDataHora(), null, Rotulos.alimentacao(a), Rotulos.descreverAlimentacao(a))));
        r.sonos().forEach(s -> itens.add(new LinhaDoTempoItemResponse("SONO", s.getId(), s.getFim() == null ? "EM_ANDAMENTO" : "ENCERRADO",
                s.getInicio(), s.getFim(), "Sono", Rotulos.descreverSono(s))));
        r.fraldas().forEach(fr -> itens.add(new LinhaDoTempoItemResponse("FRALDA", fr.getId(), fr.getTipo().name(),
                fr.getDataHora(), null, "Troca de fralda", Rotulos.descreverFralda(fr))));
        r.higienes().forEach(h -> itens.add(new LinhaDoTempoItemResponse("HIGIENE", h.getId(), h.getTipo().name(),
                h.getDataHora(), null, Rotulos.higiene(h.getTipo()), Rotulos.juntar(h.getObservacoes()))));
        r.atividades().forEach(at -> itens.add(new LinhaDoTempoItemResponse("ATIVIDADE", at.getId(), at.getTipo().name(),
                at.getDataHora(), null, Rotulos.atividade(at.getTipo()),
                Rotulos.juntar(at.getDescricao(), at.getDuracaoMinutos() == null ? null : Rotulos.duracao(at.getDuracaoMinutos())))));
        r.medicamentos().forEach(m -> itens.add(new LinhaDoTempoItemResponse("MEDICAMENTO", m.getId(), "MEDICAMENTO",
                m.getDataHora(), null, "Medicamento: " + m.getNomeMedicamento(),
                Rotulos.juntar(m.getDosagem(), m.getViaAdministracao(), m.getObservacoes()))));

        itens.sort(Comparator.comparing(LinhaDoTempoItemResponse::dataHora)
                .thenComparing(LinhaDoTempoItemResponse::categoria)
                .thenComparing(LinhaDoTempoItemResponse::id));
        return itens;
    }

    // ---------- Resumo do dia ----------

    public ResumoDiaResponse resumoDoDia(Long bebeId, LocalDate data) {
        acesso.verificarAcesso(bebeId);
        PeriodoConsulta dia = PeriodoConsulta.de(data, data);
        Registros r = carregar(bebeId, dia);

        var proximos = horarioRepository
                .findByBebeIdAndStatusAndDataHoraPrevistaGreaterThanEqualOrderByDataHoraPrevista(
                        bebeId, StatusHorarioPrevistoEnum.PENDENTE, dia.inicio(), Limit.of(LIMITE_PROXIMOS))
                .stream().map(diarioMapper::toResponse).toList();

        var observacoes = diarioRepository
                .findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(bebeId, dia.inicio(), dia.fimExclusivo())
                .stream().map(n -> n.getTitulo()).toList();

        return new ResumoDiaResponse(dia.primeiroDia(), r.total(), resumirAlimentacao(r.alimentacoes()),
                resumirSono(r.sonos()), resumirFraldas(r.fraldas()),
                r.higienes().size() + r.atividades().size(), r.medicamentos().size(), proximos, observacoes);
    }

    private ResumoDiaResponse.Alimentacao resumirAlimentacao(List<RegistroAlimentacao> lista) {
        List<RegistroAlimentacao> mamadeiras = filtrar(lista, a -> a.getTipo() == TipoAlimentacaoEnum.MAMADEIRA);
        List<Integer> volumes = mamadeiras.stream().map(RegistroAlimentacao::getVolumeMl).filter(Objects::nonNull).toList();
        return new ResumoDiaResponse.Alimentacao(lista.size(), mamadeiras.size(),
                filtrar(mamadeiras, a -> a.getTipoLeite() == TipoLeiteEnum.LEITE_MATERNO).size(),
                filtrar(mamadeiras, a -> a.getTipoLeite() == TipoLeiteEnum.FORMULA).size(),
                filtrar(lista, a -> a.getTipo() == TipoAlimentacaoEnum.PEITO).size(),
                filtrar(lista, a -> a.getTipo() == TipoAlimentacaoEnum.SOLIDA).size(),
                volumes.isEmpty() ? null : volumes.stream().mapToInt(Integer::intValue).sum(),
                mamadeiras.size() - volumes.size());
    }

    private ResumoDiaResponse.Sono resumirSono(List<RegistroSono> lista) {
        List<Integer> duracoes = lista.stream().map(RegistroSono::getDuracaoMinutos).filter(Objects::nonNull).toList();
        int emAndamento = (int) lista.stream().filter(s -> s.getFim() == null).count();
        return new ResumoDiaResponse.Sono(lista.size(),
                duracoes.isEmpty() ? null : duracoes.stream().mapToInt(Integer::intValue).sum(), emAndamento);
    }

    private ResumoDiaResponse.Fraldas resumirFraldas(List<RegistroFralda> lista) {
        Map<TipoFraldaEnum, Long> porTipo = lista.stream()
                .collect(Collectors.groupingBy(RegistroFralda::getTipo, Collectors.counting()));
        Function<TipoFraldaEnum, Integer> qtd = t -> porTipo.getOrDefault(t, 0L).intValue();
        // Uma troca com xixi e cocô conta uma vez em "trocas" e uma vez em cada eliminação
        return new ResumoDiaResponse.Fraldas(lista.size(), qtd.apply(TipoFraldaEnum.XIXI), qtd.apply(TipoFraldaEnum.COCO),
                qtd.apply(TipoFraldaEnum.MISTO), qtd.apply(TipoFraldaEnum.LIMPA),
                (int) lista.stream().filter(RegistroFralda::temXixi).count(),
                (int) lista.stream().filter(RegistroFralda::temCoco).count());
    }

    // ---------- Estatísticas ----------

    public EstatisticasResponse estatisticas(Long bebeId, PeriodoConsulta periodo) {
        acesso.verificarAcesso(bebeId);
        List<EstatisticasResponse.Dia> dias = calcularDias(bebeId, periodo);

        PeriodoConsulta anterior = new PeriodoConsulta(
                periodo.primeiroDia().minusDays(periodo.quantidadeDias()), periodo.primeiroDia().minusDays(1));
        List<EstatisticasResponse.Dia> diasAnteriores = calcularDias(bebeId, anterior);

        return new EstatisticasResponse(periodo.primeiroDia(), periodo.ultimoDia(), dias,
                consolidar(periodo, dias), consolidar(anterior, diasAnteriores));
    }

    private List<EstatisticasResponse.Dia> calcularDias(Long bebeId, PeriodoConsulta periodo) {
        Registros r = carregar(bebeId, periodo);
        List<EstatisticasResponse.Dia> dias = new ArrayList<>();

        for (LocalDate d = periodo.primeiroDia(); !d.isAfter(periodo.ultimoDia()); d = d.plusDays(1)) {
            LocalDate dia = d;
            var alimentacoes = filtrar(r.alimentacoes(), a -> a.getDataHora().toLocalDate().equals(dia));
            var sonos = filtrar(r.sonos(), s -> s.getInicio().toLocalDate().equals(dia));
            var fraldas = filtrar(r.fraldas(), f -> f.getDataHora().toLocalDate().equals(dia));
            boolean possuiRegistros = !alimentacoes.isEmpty() || !sonos.isEmpty() || !fraldas.isEmpty()
                    || r.higienes().stream().anyMatch(h -> h.getDataHora().toLocalDate().equals(dia))
                    || r.atividades().stream().anyMatch(a -> a.getDataHora().toLocalDate().equals(dia))
                    || r.medicamentos().stream().anyMatch(m -> m.getDataHora().toLocalDate().equals(dia));

            if (!possuiRegistros) {
                dias.add(new EstatisticasResponse.Dia(dia, false, null, null, null, null, null, null, null));
                continue;
            }

            Integer sonoMinutos = somarOuNulo(sonos.stream().map(RegistroSono::getDuracaoMinutos));
            Integer volume = somarOuNulo(alimentacoes.stream()
                    .filter(a -> a.getTipo() == TipoAlimentacaoEnum.MAMADEIRA).map(RegistroAlimentacao::getVolumeMl));
            dias.add(new EstatisticasResponse.Dia(dia, true, sonoMinutos, sonos.size(), alimentacoes.size(), volume, fraldas.size(),
                    (int) fraldas.stream().filter(RegistroFralda::temXixi).count(),
                    (int) fraldas.stream().filter(RegistroFralda::temCoco).count()));
        }
        return dias;
    }

    private EstatisticasResponse.Periodo consolidar(PeriodoConsulta periodo, List<EstatisticasResponse.Dia> dias) {
        List<EstatisticasResponse.Dia> comRegistro = filtrar(dias, EstatisticasResponse.Dia::possuiRegistros);
        return new EstatisticasResponse.Periodo(periodo.primeiroDia(), periodo.ultimoDia(), comRegistro.size(),
                media(dias.stream().map(EstatisticasResponse.Dia::sonoMinutos)),
                media(comRegistro.stream().map(EstatisticasResponse.Dia::refeicoes)),
                media(dias.stream().map(EstatisticasResponse.Dia::volumeMl)),
                media(comRegistro.stream().map(EstatisticasResponse.Dia::fraldas)),
                media(comRegistro.stream().map(EstatisticasResponse.Dia::trocasComXixi)),
                media(comRegistro.stream().map(EstatisticasResponse.Dia::trocasComCoco)));
    }

    private static Integer somarOuNulo(Stream<Integer> valores) {
        List<Integer> presentes = valores.filter(Objects::nonNull).toList();
        return presentes.isEmpty() ? null : presentes.stream().mapToInt(Integer::intValue).sum();
    }

    private static Double media(Stream<Integer> valores) {
        List<Integer> presentes = valores.filter(Objects::nonNull).toList();
        if (presentes.isEmpty()) {
            return null;
        }
        double media = presentes.stream().mapToInt(Integer::intValue).average().orElseThrow();
        return Math.round(media * 10) / 10.0;
    }

    private static <T> List<T> filtrar(List<T> lista, java.util.function.Predicate<T> condicao) {
        return lista.stream().filter(condicao).toList();
    }
}
