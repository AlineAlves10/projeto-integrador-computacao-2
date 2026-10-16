package br.com.projeto;

import br.com.projeto.repository.UsuarioRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Testes de integração da API: requisições HTTP reais (MockMvc) passando por segurança, validação, serviços e banco (H2).
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BabaPremiumIntegracaoTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n', 0, 0, 0, 13, 'I', 'H', 'D', 'R'};

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // ---------- utilitários ----------

    private record Sessao(String token, Long usuarioId, List<Long> bebes) {
    }

    private static String email() {
        return "u" + UUID.randomUUID().toString().substring(0, 8) + "@teste.com";
    }

    private static String bebeJson(String nome, String nascimento) {
        return """
                {"nome":"%s","dataNascimento":"%s","sexo":"F","observacoes":"Sem alergias"}""".formatted(nome, nascimento);
    }

    private ResultActions cadastrar(String email, String tipo, String bebesJson) throws Exception {
        String corpo = """
                {"nome":"Pessoa Teste","email":"%s","senha":"segredo123","tipo":"%s","bebes":[%s]}"""
                .formatted(email, tipo, bebesJson);
        return mvc.perform(post("/auth/cadastro").contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    private Sessao novaSessao(String tipo, String... bebes) throws Exception {
        String corpo = cadastrar(email(), tipo, String.join(",", bebes))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        List<Integer> ids = JsonPath.read(corpo, "$.bebes[*].id");
        return new Sessao(JsonPath.read(corpo, "$.sessao.token"),
                ((Integer) JsonPath.read(corpo, "$.sessao.usuario.id")).longValue(),
                ids.stream().map(Integer::longValue).toList());
    }

    private ResultActions get(String url, Sessao s) throws Exception {
        return mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url)
                .header("Authorization", "Bearer " + s.token()));
    }

    private ResultActions enviar(HttpMethod metodo, String url, Sessao s, String json) throws Exception {
        return mvc.perform(request(metodo, url).header("Authorization", "Bearer " + s.token())
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private Long idCriado(ResultActions acao) throws Exception {
        String corpo = acao.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return ((Integer) JsonPath.read(corpo, "$.id")).longValue();
    }

    private static final LocalDate ONTEM = LocalDate.now().minusDays(1);

    private static String ontemAs(String hora) {
        return ONTEM + "T" + hora + ":00";
    }

    // ---------- 1 e 2: cadastro de responsável ----------

    @Test
    @DisplayName("1. Responsável com um bebê: conta, bebê e vínculo criados; senha armazenada com hash")
    void cadastroResponsavelComUmBebe() throws Exception {
        String email = email();
        String corpo = cadastrar(email, "RESPONSAVEL", bebeJson("Lucas", "2026-04-01"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sessao.token").isNotEmpty())
                .andExpect(jsonPath("$.bebes", hasSize(1)))
                .andExpect(jsonPath("$.bebes[0].nomeResponsavel").value("Pessoa Teste"))
                .andReturn().getResponse().getContentAsString();

        Sessao s = new Sessao(JsonPath.read(corpo, "$.sessao.token"), null, List.of());
        get("/bebes/meus", s)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].bebe.nome").value("Lucas"))
                .andExpect(jsonPath("$[0].papel").value("RESPONSAVEL"));

        String senhaGravada = usuarioRepository.findByEmailIgnoreCase(email).orElseThrow().getSenha();
        assertThat(senhaGravada).isNotEqualTo("segredo123").startsWith("$2");

        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email.toUpperCase() + "\",\"senha\":\"segredo123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("2. Responsável com vários bebês: todos vinculados, sem sobrescrever dados; falha em um desfaz tudo")
    void cadastroResponsavelComVariosBebes() throws Exception {
        Sessao s = novaSessao("RESPONSAVEL", bebeJson("Ana", "2025-12-10"), bebeJson("Bia", "2025-12-10"));
        assertThat(s.bebes()).hasSize(2).doesNotHaveDuplicates();

        get("/bebes/meus", s)
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].bebe.nome").value("Ana"))
                .andExpect(jsonPath("$[1].bebe.nome").value("Bia"));

        // Segundo bebê inválido: nada é gravado (nem a conta)
        String email = email();
        cadastrar(email, "RESPONSAVEL", bebeJson("Caio", "2025-01-01") + ",{\"nome\":\"\",\"sexo\":\"M\"}")
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("bebes[1]")));
        assertThat(usuarioRepository.findByEmailIgnoreCase(email)).isEmpty();

        // Mesmo bebê enviado duas vezes (ex.: duplo clique): rejeitado e nada é gravado
        String email2 = email();
        cadastrar(email2, "RESPONSAVEL", bebeJson("Davi", "2025-01-01") + "," + bebeJson("Davi", "2025-01-01"))
                .andExpect(status().isConflict());
        assertThat(usuarioRepository.findByEmailIgnoreCase(email2)).isEmpty();

        // E-mail repetido
        cadastrar(email2, "RESPONSAVEL", bebeJson("Davi", "2025-01-01")).andExpect(status().isCreated());
        cadastrar(email2, "RESPONSAVEL", bebeJson("Davi", "2025-01-01")).andExpect(status().isConflict());

        // Responsável sem bebê
        cadastrar(email(), "RESPONSAVEL", "").andExpect(status().isBadRequest());
    }

    // ---------- 3: babá cadastra bebê ----------

    @Test
    @DisplayName("3. Babá cadastrando bebê: nome do responsável obrigatório, salvo e recuperado")
    void babaCadastraBebeComNomeDoResponsavel() throws Exception {
        Sessao baba = novaSessao("BABA");

        enviar(HttpMethod.POST, "/bebes", baba, bebeJson("Theo", "2026-02-01"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("nome do responsável")));
        enviar(HttpMethod.POST, "/bebes", baba,
                "{\"nome\":\"Theo\",\"dataNascimento\":\"2026-02-01\",\"sexo\":\"M\",\"observacoes\":\"x\",\"nomeResponsavel\":\"   \"}")
                .andExpect(status().isBadRequest());

        Long id = idCriado(enviar(HttpMethod.POST, "/bebes", baba,
                "{\"nome\":\"Theo\",\"dataNascimento\":\"2026-02-01\",\"sexo\":\"M\",\"observacoes\":\"x\",\"nomeResponsavel\":\"Carla Souza\"}"));

        get("/bebes/" + id, baba)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nomeResponsavel").value("Carla Souza"));
        get("/bebes/meus", baba).andExpect(jsonPath("$[0].papel").value("BABA"));
        get("/bebes/baba/" + baba.usuarioId() + "?nomeResponsavel=carla", baba)
                .andExpect(jsonPath("$.content", hasSize(1)));

        // Babá não cadastra bebês junto com a conta
        cadastrar(email(), "BABA", bebeJson("X", "2026-01-01")).andExpect(status().isBadRequest());
    }

    // ---------- 4: foto ----------

    @Test
    @DisplayName("4. Upload de foto: valida conteúdo, persiste, recupera e remove")
    void uploadPersistenciaERecuperacaoDaFoto() throws Exception {
        Sessao s = novaSessao("RESPONSAVEL", bebeJson("Lia", "2026-01-15"));
        Long bebe = s.bebes().getFirst();

        // Texto disfarçado de PNG (nome e Content-Type mentem): rejeitado pelo conteúdo
        mvc.perform(multipart(HttpMethod.PUT, "/bebes/" + bebe + "/foto")
                        .file(new MockMultipartFile("arquivo", "foto.png", "image/png", "<svg onload=alert(1)>".getBytes()))
                        .header("Authorization", "Bearer " + s.token()))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("JPEG, PNG ou WebP")));

        mvc.perform(multipart(HttpMethod.PUT, "/bebes/" + bebe + "/foto")
                        .file(new MockMultipartFile("arquivo", "qualquer.bin", "application/octet-stream", PNG))
                        .header("Authorization", "Bearer " + s.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.possuiFoto").value(true));

        get("/bebes/" + bebe, s).andExpect(jsonPath("$.possuiFoto").value(true));
        byte[] recuperada = get("/bebes/" + bebe + "/foto", s)
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(recuperada).isEqualTo(PNG);

        // Outra família não acessa a foto
        Sessao outra = novaSessao("RESPONSAVEL", bebeJson("Outro", "2026-01-01"));
        get("/bebes/" + bebe + "/foto", outra).andExpect(status().isForbidden());

        mvc.perform(delete("/bebes/" + bebe + "/foto").header("Authorization", "Bearer " + s.token()))
                .andExpect(status().isNoContent());
        get("/bebes/" + bebe + "/foto", s).andExpect(status().isNotFound());
        get("/bebes/" + bebe, s).andExpect(jsonPath("$.possuiFoto").value(false));
    }

    // ---------- 5 e 6: troca de bebê e isolamento ----------

    @Test
    @DisplayName("5 e 6. Duas crianças: cada consulta usa o bebê da URL; atividade do bebê A não aparece no B")
    void atividadeDoBebeANaoApareceNoBebeB() throws Exception {
        Sessao s = novaSessao("RESPONSAVEL", bebeJson("Gael", "2025-10-01"), bebeJson("Maya", "2025-10-01"));
        Long a = s.bebes().get(0);
        Long b = s.bebes().get(1);

        get("/bebes/" + a, s).andExpect(jsonPath("$.nome").value("Gael"));
        get("/bebes/" + b, s).andExpect(jsonPath("$.nome").value("Maya"));

        Long registro = idCriado(enviar(HttpMethod.POST, "/bebes/" + a + "/alimentacoes", s,
                "{\"tipo\":\"MAMADEIRA\",\"tipoLeite\":\"FORMULA\",\"dataHora\":\"" + ontemAs("09:00") + "\",\"volumeMl\":120}"));

        get("/bebes/" + a + "/linha-do-tempo?inicio=" + ONTEM, s).andExpect(jsonPath("$", hasSize(1)));
        get("/bebes/" + b + "/linha-do-tempo?inicio=" + ONTEM, s).andExpect(jsonPath("$", hasSize(0)));
        get("/bebes/" + b + "/alimentacoes?inicio=" + ONTEM, s).andExpect(jsonPath("$", hasSize(0)));

        // Apagar o registro de A usando a rota de B não funciona
        mvc.perform(delete("/bebes/" + b + "/alimentacoes/" + registro).header("Authorization", "Bearer " + s.token()))
                .andExpect(status().isNotFound());
        get("/bebes/" + a + "/alimentacoes?inicio=" + ONTEM, s).andExpect(jsonPath("$", hasSize(1)));
    }

    // ---------- 7: resumo e estatísticas ----------

    @Test
    @DisplayName("7. Resumo diário e estatísticas calculados a partir dos registros persistidos")
    void resumoEEstatisticasComDadosPersistidos() throws Exception {
        Sessao s = novaSessao("RESPONSAVEL", bebeJson("Nina", "2025-09-01"));
        String base = "/bebes/" + s.bebes().getFirst();

        idCriado(enviar(HttpMethod.POST, base + "/alimentacoes", s, "{\"tipo\":\"MAMADEIRA\",\"tipoLeite\":\"FORMULA\",\"dataHora\":\"" + ontemAs("08:00") + "\",\"volumeMl\":120}"));
        idCriado(enviar(HttpMethod.POST, base + "/alimentacoes", s, "{\"tipo\":\"MAMADEIRA\",\"tipoLeite\":\"FORMULA\",\"dataHora\":\"" + ontemAs("11:00") + "\",\"volumeMl\":90}"));
        idCriado(enviar(HttpMethod.POST, base + "/alimentacoes", s, "{\"tipo\":\"MAMADEIRA\",\"tipoLeite\":\"FORMULA\",\"dataHora\":\"" + ontemAs("13:00") + "\"}"));
        idCriado(enviar(HttpMethod.POST, base + "/alimentacoes", s, "{\"tipo\":\"PEITO\",\"lado\":\"ESQUERDO\",\"dataHora\":\"" + ontemAs("15:00") + "\",\"duracaoMinutos\":15,\"volumeMl\":999}"));
        idCriado(enviar(HttpMethod.POST, base + "/sonos", s, "{\"inicio\":\"" + ontemAs("09:00") + "\",\"fim\":\"" + ontemAs("10:30") + "\"}"));
        Long sonoAberto = idCriado(enviar(HttpMethod.POST, base + "/sonos", s, "{\"inicio\":\"" + ontemAs("20:00") + "\"}"));
        enviar(HttpMethod.POST, base + "/sonos", s, "{\"inicio\":\"" + ontemAs("21:00") + "\"}")
                .andExpect(status().isBadRequest()); // já há sono em andamento
        idCriado(enviar(HttpMethod.POST, base + "/fraldas", s, "{\"tipo\":\"XIXI\",\"dataHora\":\"" + ontemAs("08:30") + "\"}"));
        idCriado(enviar(HttpMethod.POST, base + "/fraldas", s, "{\"tipo\":\"COCO\",\"dataHora\":\"" + ontemAs("12:00") + "\"}"));
        idCriado(enviar(HttpMethod.POST, base + "/higienes", s, "{\"tipo\":\"BANHO\",\"dataHora\":\"" + ontemAs("18:00") + "\"}"));
        idCriado(enviar(HttpMethod.POST, base + "/atividades", s, "{\"tipo\":\"BRINCADEIRA\",\"dataHora\":\"" + ontemAs("16:00") + "\",\"duracaoMinutos\":20}"));

        // Registro de atividade realizada não pode estar no futuro
        enviar(HttpMethod.POST, base + "/fraldas", s, "{\"tipo\":\"XIXI\",\"dataHora\":\"" + LocalDateTime.now().plusDays(1).withNano(0) + "\"}")
                .andExpect(status().isBadRequest());

        get(base + "/resumo?data=" + ONTEM, s)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRegistros").value(10))
                .andExpect(jsonPath("$.alimentacao.refeicoes").value(4))
                .andExpect(jsonPath("$.alimentacao.volumeTotalMl").value(210)) // volume do PEITO é descartado
                .andExpect(jsonPath("$.alimentacao.mamadeirasSemVolume").value(1))
                .andExpect(jsonPath("$.sono.periodos").value(2))
                .andExpect(jsonPath("$.sono.minutosTotais").value(90))
                .andExpect(jsonPath("$.sono.emAndamento").value(1))
                .andExpect(jsonPath("$.fraldas.trocas").value(2))
                .andExpect(jsonPath("$.fraldas.coco").value(1))
                .andExpect(jsonPath("$.atividades").value(2));

        // Encerrar o sono em andamento atualiza a duração
        enviar(HttpMethod.PATCH, base + "/sonos/" + sonoAberto + "/fim", s, "{\"fim\":\"" + ontemAs("22:00") + "\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.duracaoMinutos").value(120));

        LocalDate inicio = ONTEM.minusDays(2);
        get(base + "/estatisticas?inicio=" + inicio + "&fim=" + ONTEM, s)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dias", hasSize(3)))
                .andExpect(jsonPath("$.dias[0].possuiRegistros").value(false))
                .andExpect(jsonPath("$.dias[0].fraldas").value(nullValue())) // sem registro não vira zero
                .andExpect(jsonPath("$.dias[2].sonoMinutos").value(210))
                .andExpect(jsonPath("$.dias[2].volumeMl").value(210))
                .andExpect(jsonPath("$.dias[2].refeicoes").value(4))
                .andExpect(jsonPath("$.dias[2].fraldas").value(2))
                .andExpect(jsonPath("$.periodo.diasComRegistro").value(1))
                .andExpect(jsonPath("$.periodo.mediaFraldas").value(2.0))
                .andExpect(jsonPath("$.periodoAnterior.diasComRegistro").value(0))
                .andExpect(jsonPath("$.periodoAnterior.mediaSonoMinutos").value(nullValue()));

        get(base + "/linha-do-tempo?inicio=" + ONTEM, s)
                .andExpect(jsonPath("$", hasSize(10)))
                .andExpect(jsonPath("$[0].dataHora").value(ontemAs("08:00")))
                .andExpect(jsonPath("$[0].descricao").value("120 ml"));
    }

    // ---------- 8: diário ----------

    @Test
    @DisplayName("8. Diário: criar, listar, editar (só o autor) e excluir")
    void cadastroEConsultaDoDiario() throws Exception {
        Sessao resp = novaSessao("RESPONSAVEL", bebeJson("Rafa", "2025-08-01"));
        Long bebe = resp.bebes().getFirst();
        String base = "/bebes/" + bebe + "/diario";

        Long nota = idCriado(enviar(HttpMethod.POST, base, resp,
                "{\"titulo\":\"Primeiro sorriso\",\"texto\":\"Sorriu ao ouvir música.\",\"tag\":\"MARCO\"}"));
        enviar(HttpMethod.POST, base, resp, "{\"titulo\":\"\",\"texto\":\"x\",\"tag\":\"GERAL\"}").andExpect(status().isBadRequest());

        get(base, resp)
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].autorNome").value("Pessoa Teste"))
                .andExpect(jsonPath("$[0].tag").value("MARCO"));

        enviar(HttpMethod.PUT, base + "/" + nota, resp, "{\"titulo\":\"Primeiro sorriso!\",\"texto\":\"Editado.\",\"tag\":\"HUMOR\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.texto").value("Editado."))
                .andExpect(jsonPath("$.atualizadoEm").isNotEmpty());

        // Babá vinculada lê, mas não edita a nota de outra pessoa
        Sessao baba = novaSessao("BABA");
        enviar(HttpMethod.POST, "/bebes/" + bebe + "/usuarios", resp,
                "{\"usuarioId\":" + baba.usuarioId() + ",\"bebeId\":" + bebe + ",\"papel\":\"BABA\"}")
                .andExpect(status().isCreated());
        get(base, baba).andExpect(jsonPath("$", hasSize(1)));
        enviar(HttpMethod.PUT, base + "/" + nota, baba, "{\"titulo\":\"x\",\"texto\":\"x\",\"tag\":\"GERAL\"}")
                .andExpect(status().isForbidden());

        mvc.perform(delete(base + "/" + nota).header("Authorization", "Bearer " + resp.token()))
                .andExpect(status().isNoContent());
        get(base, resp).andExpect(jsonPath("$", hasSize(0)));
    }

    // ---------- 9: saúde ----------

    @Test
    @DisplayName("9. Saúde: biometria com histórico, vacinas e medicamentos com validações")
    void registroEConsultaDeSaude() throws Exception {
        Sessao s = novaSessao("RESPONSAVEL", bebeJson("Iris", "2025-06-01"));
        String base = "/bebes/" + s.bebes().getFirst();

        idCriado(enviar(HttpMethod.POST, base + "/crescimentos", s, "{\"dataRegistro\":\"2025-09-01\",\"pesoKg\":5.20,\"alturaCm\":58.5}"));
        idCriado(enviar(HttpMethod.POST, base + "/crescimentos", s, "{\"dataRegistro\":\"2025-12-01\",\"pesoKg\":6.80,\"alturaCm\":63.0,\"perimetroCefalicoCm\":41.2}"));
        enviar(HttpMethod.POST, base + "/crescimentos", s, "{\"dataRegistro\":\"2025-12-02\"}")
                .andExpect(status().isBadRequest()); // nenhuma medida
        enviar(HttpMethod.POST, base + "/crescimentos", s, "{\"dataRegistro\":\"2025-12-02\",\"pesoKg\":75}")
                .andExpect(status().isBadRequest()); // fora do limite (erro de digitação)

        get(base + "/crescimentos", s)
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].pesoKg").value(6.8))
                .andExpect(jsonPath("$[1].pesoKg").value(5.2)); // medição antiga preservada

        idCriado(enviar(HttpMethod.POST, base + "/vacinas", s,
                "{\"nomeVacina\":\"Pentavalente\",\"dose\":\"1ª dose\",\"dataAplicacao\":\"2025-08-01\",\"proximaDose\":\"2025-10-01\"}"));
        enviar(HttpMethod.POST, base + "/vacinas", s,
                "{\"nomeVacina\":\"VIP\",\"dose\":\"1ª dose\",\"dataAplicacao\":\"2025-08-01\",\"proximaDose\":\"2025-07-01\"}")
                .andExpect(status().isBadRequest());
        get(base + "/vacinas", s)
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].dataAplicacao").value("2025-08-01"));

        idCriado(enviar(HttpMethod.POST, base + "/medicamentos", s,
                "{\"nomeMedicamento\":\"Vitamina D\",\"dosagem\":\"2 gotas\",\"dataHora\":\"" + ontemAs("08:00") + "\",\"viaAdministracao\":\"Oral\"}"));
        get(base + "/medicamentos", s).andExpect(jsonPath("$[0].nomeMedicamento").value("Vitamina D"));
        get(base + "/linha-do-tempo?inicio=" + ONTEM, s).andExpect(jsonPath("$[0].categoria").value("MEDICAMENTO"));
    }

    // ---------- 10: horários previstos ----------

    @Test
    @DisplayName("10. Horários previstos: criar, consultar pendentes e concluir sem criar registro de rotina")
    void consultaDeHorariosPrevistos() throws Exception {
        Sessao s = novaSessao("RESPONSAVEL", bebeJson("Enzo", "2025-07-01"));
        String base = "/bebes/" + s.bebes().getFirst();
        String amanha = LocalDate.now().plusDays(1) + "T10:00:00";

        Long horario = idCriado(enviar(HttpMethod.POST, base + "/horarios-previstos", s,
                "{\"tipo\":\"CONSULTA\",\"dataHoraPrevista\":\"" + amanha + "\",\"descricao\":\"Pediatra\"}"));
        enviar(HttpMethod.POST, base + "/horarios-previstos", s,
                "{\"tipo\":\"ALIMENTACAO\",\"dataHoraPrevista\":\"" + ontemAs("10:00") + "\"}")
                .andExpect(status().isBadRequest()); // no passado

        get(base + "/horarios-previstos?status=PENDENTE", s)
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].descricao").value("Pediatra"))
                .andExpect(jsonPath("$[0].criadoPorNome").value("Pessoa Teste"));
        get(base + "/resumo", s).andExpect(jsonPath("$.proximosHorarios", hasSize(1)));

        enviar(HttpMethod.PATCH, base + "/horarios-previstos/" + horario + "/status", s, "{\"status\":\"CONCLUIDO\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONCLUIDO"));
        enviar(HttpMethod.PATCH, base + "/horarios-previstos/" + horario + "/status", s, "{\"status\":\"CANCELADO\"}")
                .andExpect(status().isBadRequest());

        get(base + "/horarios-previstos?status=PENDENTE", s).andExpect(jsonPath("$", hasSize(0)));
        get(base + "/resumo", s).andExpect(jsonPath("$.totalRegistros").value(0)); // concluir não cria registro
    }

    // ---------- 12: alimentação por tipo ----------

    @Test
    @DisplayName("12. Alimentação: cada tipo exige e persiste apenas os seus campos; lado só na amamentação no peito")
    void alimentacaoPersisteApenasCamposDoTipo() throws Exception {
        Sessao s = novaSessao("RESPONSAVEL", bebeJson("Lia", "2025-08-01"));
        String base = "/bebes/" + s.bebes().getFirst();
        String url = base + "/alimentacoes";

        // Peito: lado obrigatório; volume, tipo de leite e alimento enviados por engano são descartados
        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"PEITO\",\"dataHora\":\"" + ontemAs("08:00") + "\"}")
                .andExpect(status().isBadRequest());
        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"PEITO\",\"lado\":\"AMBOS\",\"dataHora\":\"" + ontemAs("08:00")
                + "\",\"volumeMl\":100,\"tipoLeite\":\"FORMULA\",\"alimento\":\"banana\",\"quantidade\":\"2\",\"observacao\":\"tranquila\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.lado").value("AMBOS"))
                .andExpect(jsonPath("$.volumeMl").value(nullValue()))
                .andExpect(jsonPath("$.tipoLeite").value(nullValue()))
                .andExpect(jsonPath("$.alimento").value(nullValue()))
                .andExpect(jsonPath("$.quantidade").value(nullValue()))
                .andExpect(jsonPath("$.observacao").value("tranquila"));

        // Mamadeira: exige leite materno ou fórmula; lado e duração são descartados
        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"MAMADEIRA\",\"dataHora\":\"" + ontemAs("09:00") + "\",\"volumeMl\":90}")
                .andExpect(status().isBadRequest());
        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"MAMADEIRA\",\"tipoLeite\":\"SUCO\",\"dataHora\":\"" + ontemAs("09:00") + "\"}")
                .andExpect(status().isBadRequest());
        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"MAMADEIRA\",\"tipoLeite\":\"LEITE_MATERNO\",\"dataHora\":\"" + ontemAs("09:00")
                + "\",\"volumeMl\":90,\"lado\":\"DIREITO\",\"duracaoMinutos\":10,\"alimento\":\"papinha\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipoLeite").value("LEITE_MATERNO"))
                .andExpect(jsonPath("$.volumeMl").value(90))
                .andExpect(jsonPath("$.lado").value(nullValue()))
                .andExpect(jsonPath("$.duracaoMinutos").value(nullValue()))
                .andExpect(jsonPath("$.alimento").value(nullValue()));
        idCriado(enviar(HttpMethod.POST, url, s, "{\"tipo\":\"MAMADEIRA\",\"tipoLeite\":\"FORMULA\",\"dataHora\":\"" + ontemAs("10:00") + "\",\"volumeMl\":120}"));

        // Papinha ou refeição: exige o alimento; lado, volume e tipo de leite são descartados
        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"SOLIDA\",\"dataHora\":\"" + ontemAs("11:00") + "\"}")
                .andExpect(status().isBadRequest());
        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"SOLIDA\",\"dataHora\":\"" + ontemAs("11:00")
                + "\",\"alimento\":\"Papinha de abóbora\",\"quantidade\":\"4 colheres\",\"lado\":\"ESQUERDO\",\"volumeMl\":50,\"tipoLeite\":\"FORMULA\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.alimento").value("Papinha de abóbora"))
                .andExpect(jsonPath("$.quantidade").value("4 colheres"))
                .andExpect(jsonPath("$.lado").value(nullValue()))
                .andExpect(jsonPath("$.volumeMl").value(nullValue()))
                .andExpect(jsonPath("$.tipoLeite").value(nullValue()));

        // O que foi persistido (relido do banco) confirma o descarte
        get(url + "?inicio=" + ONTEM + "&fim=" + ONTEM, s)
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].volumeMl").value(nullValue()))
                .andExpect(jsonPath("$[1].lado").value(nullValue()))
                .andExpect(jsonPath("$[3].lado").value(nullValue()));

        get(base + "/resumo?data=" + ONTEM, s)
                .andExpect(jsonPath("$.alimentacao.refeicoes").value(4))
                .andExpect(jsonPath("$.alimentacao.mamadeiras").value(2))
                .andExpect(jsonPath("$.alimentacao.mamadeirasLeiteMaterno").value(1))
                .andExpect(jsonPath("$.alimentacao.mamadeirasFormula").value(1))
                .andExpect(jsonPath("$.alimentacao.amamentacoes").value(1))
                .andExpect(jsonPath("$.alimentacao.solidas").value(1))
                .andExpect(jsonPath("$.alimentacao.volumeTotalMl").value(210));

        get(base + "/linha-do-tempo?inicio=" + ONTEM, s)
                .andExpect(jsonPath("$[0].titulo").value("Amamentação no peito"))
                .andExpect(jsonPath("$[0].descricao").value("Ambos os lados • tranquila"))
                .andExpect(jsonPath("$[1].titulo").value("Mamadeira de leite materno"))
                .andExpect(jsonPath("$[1].descricao").value("90 ml"))
                .andExpect(jsonPath("$[2].titulo").value("Mamadeira de fórmula infantil"))
                .andExpect(jsonPath("$[3].titulo").value("Papinha / refeição"))
                .andExpect(jsonPath("$[3].descricao").value("Papinha de abóbora • 4 colheres"));
    }

    // ---------- 13: xixi e cocô ----------

    @Test
    @DisplayName("13. Fralda: xixi, cocô ou ambos na mesma troca, sem contagem duplicada e no bebê correto")
    void trocaDeFraldaComXixiECoco() throws Exception {
        Sessao s = novaSessao("RESPONSAVEL", bebeJson("Theo", "2025-08-01"), bebeJson("Ana", "2025-08-01"));
        String a = "/bebes/" + s.bebes().get(0);
        String b = "/bebes/" + s.bebes().get(1);

        // Consistência enviada numa troca só com xixi é descartada
        enviar(HttpMethod.POST, a + "/fraldas", s, "{\"tipo\":\"XIXI\",\"dataHora\":\"" + ontemAs("07:00") + "\",\"consistenciaCoco\":\"PASTOSA\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.consistenciaCoco").value(nullValue()));
        idCriado(enviar(HttpMethod.POST, a + "/fraldas", s,
                "{\"tipo\":\"COCO\",\"dataHora\":\"" + ontemAs("09:00") + "\",\"consistenciaCoco\":\"LIQUIDA\",\"observacoes\":\"após mamada\"}"));
        enviar(HttpMethod.POST, a + "/fraldas", s, "{\"tipo\":\"MISTO\",\"dataHora\":\"" + ontemAs("12:00") + "\",\"consistenciaCoco\":\"FIRME\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.consistenciaCoco").value("FIRME"));
        idCriado(enviar(HttpMethod.POST, a + "/fraldas", s, "{\"tipo\":\"LIMPA\",\"dataHora\":\"" + ontemAs("15:00") + "\"}"));
        enviar(HttpMethod.POST, a + "/fraldas", s, "{\"tipo\":\"COCO\",\"dataHora\":\"" + ontemAs("16:00") + "\",\"consistenciaCoco\":\"VERDE\"}")
                .andExpect(status().isBadRequest()); // só categorias simples
        idCriado(enviar(HttpMethod.POST, b + "/fraldas", s, "{\"tipo\":\"XIXI\",\"dataHora\":\"" + ontemAs("10:00") + "\"}"));

        // A troca com xixi e cocô conta uma vez no total e uma vez em cada eliminação
        get(a + "/resumo?data=" + ONTEM, s)
                .andExpect(jsonPath("$.fraldas.trocas").value(4))
                .andExpect(jsonPath("$.fraldas.misto").value(1))
                .andExpect(jsonPath("$.fraldas.limpa").value(1))
                .andExpect(jsonPath("$.fraldas.trocasComXixi").value(2))
                .andExpect(jsonPath("$.fraldas.trocasComCoco").value(2));
        get(b + "/resumo?data=" + ONTEM, s)
                .andExpect(jsonPath("$.fraldas.trocas").value(1))
                .andExpect(jsonPath("$.fraldas.trocasComXixi").value(1))
                .andExpect(jsonPath("$.fraldas.trocasComCoco").value(0));

        get(a + "/estatisticas?inicio=" + ONTEM + "&fim=" + ONTEM, s)
                .andExpect(jsonPath("$.dias[0].fraldas").value(4))
                .andExpect(jsonPath("$.dias[0].trocasComXixi").value(2))
                .andExpect(jsonPath("$.dias[0].trocasComCoco").value(2))
                .andExpect(jsonPath("$.periodo.mediaTrocasComXixi").value(2.0))
                .andExpect(jsonPath("$.periodo.mediaTrocasComCoco").value(2.0));

        get(a + "/linha-do-tempo?inicio=" + ONTEM, s)
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].descricao").value("Xixi"))
                .andExpect(jsonPath("$[1].descricao").value("Cocô • Consistência líquida • após mamada"))
                .andExpect(jsonPath("$[2].descricao").value("Xixi e cocô • Consistência firme"))
                .andExpect(jsonPath("$[3].descricao").value("Limpa"));
        get(b + "/linha-do-tempo?inicio=" + ONTEM, s).andExpect(jsonPath("$", hasSize(1)));
    }

    // ---------- 14: campos por tipo de horário previsto ----------

    @Test
    @DisplayName("14. Horários previstos: cada tipo guarda só os seus campos e não vira registro de rotina")
    void horarioPrevistoCamposPorTipo() throws Exception {
        Sessao s = novaSessao("RESPONSAVEL", bebeJson("Iris", "2025-07-01"));
        String base = "/bebes/" + s.bebes().getFirst();
        String url = base + "/horarios-previstos";
        String amanha = LocalDate.now().plusDays(1) + "T";

        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"MEDICAMENTO\",\"dataHoraPrevista\":\"" + amanha + "08:00:00\"}")
                .andExpect(status().isBadRequest()); // nome do medicamento
        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"OUTRO\",\"dataHoraPrevista\":\"" + amanha + "08:00:00\",\"descricao\":\"   \"}")
                .andExpect(status().isBadRequest()); // descrição livre obrigatória

        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"MEDICAMENTO\",\"dataHoraPrevista\":\"" + amanha
                + "08:00:00\",\"descricao\":\"Vitamina D\",\"detalhes\":\"4 gotas\",\"local\":\"Farmácia\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.descricao").value("Vitamina D"))
                .andExpect(jsonPath("$.detalhes").value("4 gotas"))
                .andExpect(jsonPath("$.local").value(nullValue()));
        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"CONSULTA\",\"dataHoraPrevista\":\"" + amanha
                + "09:00:00\",\"descricao\":\"Pediatra\",\"detalhes\":\"Rotina\",\"local\":\"UBS Centro\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.detalhes").value("Rotina"))
                .andExpect(jsonPath("$.local").value("UBS Centro"));
        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"ALIMENTACAO\",\"dataHoraPrevista\":\"" + amanha
                + "10:00:00\",\"descricao\":\"Fórmula\",\"detalhes\":\"x\",\"local\":\"y\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.detalhes").value(nullValue()))
                .andExpect(jsonPath("$.local").value(nullValue()));
        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"VACINA\",\"dataHoraPrevista\":\"" + amanha
                + "11:00:00\",\"detalhes\":\"x\",\"local\":\"Posto\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.descricao").value(nullValue()))
                .andExpect(jsonPath("$.detalhes").value(nullValue()))
                .andExpect(jsonPath("$.local").value("Posto"));
        enviar(HttpMethod.POST, url, s, "{\"tipo\":\"SONO\",\"dataHoraPrevista\":\"" + amanha + "13:00:00\"}")
                .andExpect(status().isCreated()); // descrição opcional

        get(url + "?status=PENDENTE", s)
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[1].tipo").value("CONSULTA"))
                .andExpect(jsonPath("$[1].local").value("UBS Centro"));

        // Horários previstos ficam separados das atividades realizadas
        get(base + "/linha-do-tempo?inicio=" + ONTEM, s).andExpect(jsonPath("$", hasSize(0)));
        get(base + "/resumo", s)
                .andExpect(jsonPath("$.totalRegistros").value(0))
                .andExpect(jsonPath("$.proximosHorarios", hasSize(5)));
    }

    // ---------- 11: autorização ----------

    @Test
    @DisplayName("11. Bloqueio de acesso a crianças e dados de outras famílias")
    void bloqueioDeAcessoNaoAutorizado() throws Exception {
        Sessao familiaA = novaSessao("RESPONSAVEL", bebeJson("Alice", "2025-05-01"));
        Sessao familiaB = novaSessao("RESPONSAVEL", bebeJson("Bento", "2025-05-01"));
        Long bebeA = familiaA.bebes().getFirst();

        // Sem token
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/bebes/" + bebeA))
                .andExpect(status().isUnauthorized());
        // Token inválido
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/bebes/meus")
                        .header("Authorization", "Bearer abc.def.ghi"))
                .andExpect(status().isUnauthorized());

        // Família B trocando o id na URL
        get("/bebes/" + bebeA, familiaB).andExpect(status().isForbidden());
        get("/bebes/" + bebeA + "/linha-do-tempo", familiaB).andExpect(status().isForbidden());
        get("/bebes/" + bebeA + "/crescimentos", familiaB).andExpect(status().isForbidden());
        get("/bebes/" + bebeA + "/diario", familiaB).andExpect(status().isForbidden());
        get("/bebes/" + bebeA + "/estatisticas?inicio=" + ONTEM + "&fim=" + ONTEM, familiaB).andExpect(status().isForbidden());
        get("/bebes/" + bebeA + "/usuarios", familiaB).andExpect(status().isForbidden());
        enviar(HttpMethod.POST, "/bebes/" + bebeA + "/alimentacoes", familiaB,
                "{\"tipo\":\"MAMADEIRA\",\"tipoLeite\":\"FORMULA\",\"dataHora\":\"" + ontemAs("09:00") + "\"}")
                .andExpect(status().isForbidden());
        // Família B tentando se vincular sozinha ao bebê de A
        enviar(HttpMethod.POST, "/bebes/" + bebeA + "/usuarios", familiaB,
                "{\"usuarioId\":" + familiaB.usuarioId() + ",\"bebeId\":" + bebeA + ",\"papel\":\"RESPONSAVEL\"}")
                .andExpect(status().isForbidden());
        // Bebê inexistente responde igual a sem acesso
        get("/bebes/999999", familiaB).andExpect(status().isForbidden());

        // Dados pessoais de outro usuário
        get("/usuarios/" + familiaA.usuarioId(), familiaB).andExpect(status().isForbidden());
        get("/usuarios", familiaB).andExpect(jsonPath("$", hasSize(1)));
        get("/bebes/baba/" + familiaA.usuarioId(), familiaB).andExpect(status().isForbidden());
        mvc.perform(delete("/usuarios/" + familiaA.usuarioId()).header("Authorization", "Bearer " + familiaB.token()))
                .andExpect(status().isForbidden());

        // Vínculos: duplicado = 409, inexistente = 404 (exceções corrigidas)
        Sessao baba = novaSessao("BABA");
        String vinculo = "{\"usuarioId\":" + baba.usuarioId() + ",\"bebeId\":" + bebeA + ",\"papel\":\"BABA\"}";
        enviar(HttpMethod.POST, "/bebes/" + bebeA + "/usuarios", familiaA, vinculo).andExpect(status().isCreated());
        enviar(HttpMethod.POST, "/bebes/" + bebeA + "/usuarios", familiaA, vinculo).andExpect(status().isConflict());
        get("/bebes/" + bebeA + "/usuarios/" + familiaB.usuarioId(), familiaA).andExpect(status().isNotFound());
        // Após o vínculo, a babá enxerga o bebê e os dados do responsável
        get("/bebes/" + bebeA, baba).andExpect(status().isOk());
        get("/usuarios/" + familiaA.usuarioId(), baba).andExpect(status().isOk());
    }

    // ---------- 12: sem registros ----------

    @Test
    @DisplayName("12. Bebê sem registros: respostas vazias, sem números inventados")
    void respostasSemRegistros() throws Exception {
        Sessao s = novaSessao("RESPONSAVEL", bebeJson("Zoe", "2026-03-01"));
        String base = "/bebes/" + s.bebes().getFirst();

        get(base + "/resumo", s)
                .andExpect(jsonPath("$.totalRegistros").value(0))
                .andExpect(jsonPath("$.alimentacao.volumeTotalMl").value(nullValue()))
                .andExpect(jsonPath("$.sono.minutosTotais").value(nullValue()))
                .andExpect(jsonPath("$.proximosHorarios", hasSize(0)));
        get(base + "/linha-do-tempo", s).andExpect(jsonPath("$", hasSize(0)));
        get(base + "/diario", s).andExpect(jsonPath("$", hasSize(0)));
        get(base + "/crescimentos", s).andExpect(jsonPath("$", hasSize(0)));
        get(base + "/estatisticas?inicio=" + ONTEM.minusDays(6) + "&fim=" + ONTEM, s)
                .andExpect(jsonPath("$.dias", hasSize(7)))
                .andExpect(jsonPath("$.periodo.diasComRegistro").value(0))
                .andExpect(jsonPath("$.periodo.mediaRefeicoes").value(nullValue()));
        get(base + "/foto", s).andExpect(status().isNotFound());
        get("/bebes/meus", novaSessao("BABA")).andExpect(jsonPath("$", hasSize(0)));
    }
}
