"""
Teste de ponta a ponta (navegador real) do front-end Babá Premium contra a API real.

Pré-requisitos:
  - API rodando em http://localhost:8080 (com PostgreSQL)
  - Front servido em http://127.0.0.1:5500 (ex.: `python3 -m http.server 5500` dentro de frontend/)
  - pip install playwright && python -m playwright install chromium

Execução:  python frontend/tests/e2e_playwright.py
Cada execução usa e-mails novos, então pode ser repetida no mesmo banco.
"""
import re
import struct
import sys
import tempfile
import time
import zlib
from datetime import datetime, timedelta
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

FRONT = "http://127.0.0.1:5500/pages"
API = "http://localhost:8080"
RUN = str(int(time.time()))
SENHA = "segredo123"
resultados, erros_console = [], []


def png_valido(caminho: Path, cor=(139, 92, 246)):
    """Gera um PNG 8x8 real (para o upload)."""
    linha = b"\x00" + bytes(cor) * 8
    def bloco(tipo, dados):
        return struct.pack(">I", len(dados)) + tipo + dados + struct.pack(">I", zlib.crc32(tipo + dados) & 0xFFFFFFFF)
    caminho.write_bytes(b"\x89PNG\r\n\x1a\n" + bloco(b"IHDR", struct.pack(">IIBBBBB", 8, 8, 8, 2, 0, 0, 0))
                        + bloco(b"IDAT", zlib.compress(linha * 8)) + bloco(b"IEND", b""))
    return caminho


def passo(nome, fn):
    try:
        fn()
        resultados.append(("OK", nome))
    except Exception as e:  # noqa: BLE001 - relatório do teste
        resultados.append(("FALHOU", f"{nome}: {str(e).splitlines()[0][:300]}"))


def main():
    tmp = Path(tempfile.mkdtemp())
    foto_a = png_valido(tmp / "lucas.png")
    foto_nova = png_valido(tmp / "nova.png", (52, 211, 153))
    falso = tmp / "nao-e-imagem.png"
    falso.write_text("isto não é uma imagem")
    email_resp, email_baba = f"resp{RUN}@teste.com", f"baba{RUN}@teste.com"
    agora = datetime.now()

    with sync_playwright() as p:
        browser = p.chromium.launch()

        def nova_pagina():
            ctx = browser.new_context(viewport={"width": 1280, "height": 900})
            pg = ctx.new_page()
            pg.on("dialog", lambda d: d.accept())
            pg.on("console", lambda m: m.type == "error" and "Failed to load resource" not in m.text
                  and "[API Error]" not in m.text
                  and erros_console.append(f"{pg.url.split('/')[-1]}: {m.text}"))
            return pg

        resp = nova_pagina()
        baba = nova_pagina()
        alerta = lambda pg: pg.locator("#auth-alert")
        api = lambda pg, expr: pg.evaluate(expr)

        def login(pg, email, senha=SENHA):
            pg.goto(f"{FRONT}/login.html")
            pg.fill("#login-email", email)
            pg.fill("#login-senha", senha)
            pg.click("#btn-login-submit")
            pg.wait_for_url("**/dashboard.html")

        # ---------------- Cadastro ----------------
        def t_cadastro_baba():
            baba.goto(f"{FRONT}/login.html")
            baba.click("#tab-cadastro")
            baba.select_option("#cad-tipo", "BABA")
            expect(baba.locator("#campos-bebe")).to_be_hidden()
            baba.fill("#cad-nome", "Ana Babá")
            baba.fill("#cad-email", email_baba)
            baba.fill("#cad-senha", SENHA)
            baba.click("#btn-revisar")
            expect(baba.locator("#revisao-conteudo")).to_contain_text("Babá")
            baba.click("#btn-cad-submit")
            baba.wait_for_url("**/dashboard.html")
        passo("Cadastro de babá (sem bebês) entra direto no painel", t_cadastro_baba)

        def t_baba_sem_bebes():
            expect(baba.locator("#seletor-bebe")).to_contain_text("Nenhum bebê vinculado")
            expect(baba.locator("#dashboard-timeline")).to_contain_text("Nenhum bebê selecionado")
            for pagina in ["rotina.html", "saude.html", "estatisticas.html", "notas.html"]:
                baba.goto(f"{FRONT}/{pagina}")
                expect(baba.locator("#seletor-bebe")).to_contain_text("Nenhum bebê vinculado")
        passo("12. Telas sem bebê vinculado mostram estado vazio, sem erros", t_baba_sem_bebes)

        def t_cadastro_varios():
            resp.goto(f"{FRONT}/login.html")
            resp.click("#tab-cadastro")
            resp.fill("#cad-nome", "Maria Pereira")
            resp.fill("#cad-email", email_resp)
            resp.fill("#cad-senha", SENHA)
            resp.check("input[name=qtd-bebes][value=varios]")
            expect(resp.locator(".bebe-form-card")).to_have_count(2)
            # adicionar e remover um terceiro formulário
            resp.click("#btn-add-bebe")
            expect(resp.locator(".bebe-form-card")).to_have_count(3)
            resp.locator(".bebe-form-card").nth(2).locator("[data-remover]").click()
            expect(resp.locator(".bebe-form-card")).to_have_count(2)

            c1, c2 = resp.locator(".bebe-form-card").nth(0), resp.locator(".bebe-form-card").nth(1)
            c1.locator("input[id$=-nome]").fill("Lucas")
            c1.locator("input[id$=-nasc]").fill("2026-04-01")
            c1.locator("select").select_option("M")
            c1.locator("textarea").fill("Alergia a lactose")
            # arquivo inválido é recusado antes do envio
            c1.locator("input[type=file]").set_input_files(str(falso))
            expect(c1.locator("[data-erro]")).to_contain_text("Formato não suportado")
            c1.locator("input[type=file]").set_input_files(str(foto_a))
            expect(c1.locator(".foto-upload img")).to_have_attribute("src", re.compile("^blob:"))
            # validação individual: segundo bebê vazio
            resp.click("#btn-revisar")
            expect(alerta(resp)).to_contain_text("Bebê 2: informe o nome")
            c2.locator("input[id$=-nome]").fill("Lia")
            c2.locator("input[id$=-nasc]").fill("2026-04-01")
            c2.locator("select").select_option("F")
            c2.locator("textarea").fill("Nenhuma")
            resp.click("#btn-revisar")
            expect(resp.locator(".revisao-bebe")).to_have_count(2)
            expect(resp.locator("#revisao-conteudo")).to_contain_text("Lucas")
            expect(resp.locator("#revisao-conteudo")).to_contain_text("Lia")
            # voltar, editar e revisar de novo preserva os dados
            resp.click("text=Voltar e editar")
            expect(c2.locator("input[id$=-nome]")).to_have_value("Lia")
            resp.click("#btn-revisar")
            resp.click("#btn-cad-submit")
            resp.wait_for_url("**/dashboard.html")
            meus = api(resp, "ApiService.bebes.meus()")
            assert [m["bebe"]["nome"] for m in meus] == ["Lia", "Lucas"], meus
            assert all(m["papel"] == "RESPONSAVEL" for m in meus)
            assert next(m for m in meus if m["bebe"]["nome"] == "Lucas")["bebe"]["possuiFoto"] is True
            assert next(m for m in meus if m["bebe"]["nome"] == "Lia")["bebe"]["possuiFoto"] is False
        passo("1, 2 e 4. Responsável com dois bebês, foto validada e persistida, revisão antes de concluir", t_cadastro_varios)

        # ---------------- Seletor e dashboard ----------------
        def t_seletor():
            expect(resp.locator("#bebe-nome")).to_have_text("Lucas")  # primeiro bebê enviado fica ativo
            expect(resp.locator("[data-foto-ativo]")).to_have_attribute("src", re.compile("^blob:"))
            expect(resp.locator("#msg-resumo")).to_contain_text("Nenhum cuidado registrado hoje")
            expect(resp.locator("#dashboard-timeline")).to_contain_text("Nenhuma atividade registrada hoje")
            resp.click("#btn-trocar-bebe")
            expect(resp.locator("#lista-trocar-bebe button")).to_have_count(2)
            resp.keyboard.press("Escape")
            expect(resp.locator("#lista-trocar-bebe")).to_be_hidden()
        passo("5. Seletor mostra bebê ativo com foto e lista as duas crianças; painel vazio informativo", t_seletor)

        def registrar(pg, botao, preencher=None):
            pg.click(f"button.quick-action-btn:has-text('{botao}')")
            expect(pg.locator("#modal-registro")).to_be_visible()
            if preencher:
                preencher(pg)
            pg.click("#form-registro button[type=submit], #form-rotina button[type=submit]")
            expect(pg.locator("#modal-registro")).to_be_hidden()

        hora = lambda dt: dt.strftime("%H:%M")

        def t_registros_dashboard():
            registrar(resp, "Alimentação", lambda pg: (pg.select_option("#reg-tipo-alimento", "FORMULA"), pg.fill("#reg-volume", "150"),
                                                       pg.fill("#reg-hora", hora(agora - timedelta(minutes=50)))))
            registrar(resp, "Fralda", lambda pg: (pg.check("#reg-fralda-coco"), pg.fill("#reg-hora", hora(agora - timedelta(minutes=45)))))
            registrar(resp, "Sono / Soneca", lambda pg: pg.fill("#reg-sono-inicio", hora(agora - timedelta(minutes=40))))
            registrar(resp, "Banho", lambda pg: pg.fill("#reg-hora", hora(agora - timedelta(minutes=55))))
            expect(resp.locator("#resumo-leite")).to_have_text("150 ml")
            expect(resp.locator("#resumo-fraldas")).to_have_text("1 troca")
            expect(resp.locator("#resumo-sono-detalhe")).to_contain_text("dormindo agora")
            expect(resp.locator("#dashboard-timeline .timeline-item")).to_have_count(4)
            expect(resp.locator("#dashboard-timeline")).to_contain_text("150 ml")
        passo("6.4 e 6.1. Registros pelo dashboard são gravados e atualizam resumo e linha do tempo", t_registros_dashboard)

        def t_acordou():
            registrar(resp, "Hora que Acordou", lambda pg: (expect(pg.locator("#reg-encerrar-sono")).to_be_checked(),
                                                            pg.fill("#reg-hora", hora(agora - timedelta(minutes=5)))))
            expect(resp.locator("#resumo-sono")).to_have_text("35min")
            expect(resp.locator("#dashboard-timeline")).to_contain_text("Acordou")
        passo("'Hora que acordou' encerra o sono em andamento e calcula a duração", t_acordou)

        def t_campos_alimentacao():
            resp.click("button.quick-action-btn:has-text('Alimentação')")
            for opcao, lado_visivel in [("", False), ("PEITO", True), ("LEITE_MATERNO", False), ("FORMULA", False), ("SOLIDA", False)]:
                resp.select_option("#reg-tipo-alimento", opcao)
                (expect(resp.locator("#reg-lado")).to_be_visible if lado_visivel else expect(resp.locator("#reg-lado")).to_be_hidden)()
            # Valor digitado num tipo é limpo ao trocar de tipo
            resp.select_option("#reg-tipo-alimento", "FORMULA")
            resp.fill("#reg-volume", "90")
            resp.select_option("#reg-tipo-alimento", "SOLIDA")
            expect(resp.locator("#reg-volume")).to_be_hidden()
            resp.select_option("#reg-tipo-alimento", "FORMULA")
            expect(resp.locator("#reg-volume")).to_have_value("")
            resp.click("#modal-registro button:has-text('Cancelar')")
        passo("Alimentação: 'Lado' só aparece na amamentação no peito e campos trocam conforme o tipo", t_campos_alimentacao)

        def t_campos_horario():
            resp.click("text=+ Agendar")
            esperado = {"ALIMENTACAO": "Alimento ou tipo de leite", "MEDICAMENTO": "Nome do medicamento", "CONSULTA": "Profissional",
                        "SONO": "Rotina de descanso", "BANHO": "Tipo de cuidado", "OUTRO": "Descrição", "VACINA": "Vacina"}
            for tipo, rotulo in esperado.items():
                resp.select_option("#reg-horario-tipo", tipo)
                expect(resp.locator("label[for=reg-horario-descricao]")).to_contain_text(rotulo)
                if tipo != "ALIMENTACAO":
                    assert "papinha" not in resp.get_attribute("#reg-horario-descricao", "placeholder").lower()
                expect(resp.locator("#reg-horario-descricao")).to_have_value("")  # sem dados preenchidos automaticamente
            resp.select_option("#reg-horario-tipo", "CONSULTA")
            expect(resp.locator("#reg-horario-local")).to_be_visible()
            resp.select_option("#reg-horario-tipo", "SONO")
            expect(resp.locator("#reg-horario-local")).to_be_hidden()
            expect(resp.locator("#reg-horario-detalhes")).to_be_hidden()
            resp.click("#modal-registro button:has-text('Cancelar')")
        passo("Agendamento: rótulos, exemplos e campos adequados a cada tipo", t_campos_horario)

        def t_futuro():
            resp.click("button.quick-action-btn:has-text('Fralda')")
            resp.check("#reg-fralda-xixi")
            resp.fill("#reg-hora", hora(agora + timedelta(minutes=30)) if agora.hour < 23 else "23:59")
            resp.click("#form-registro button[type=submit]")
            if agora.hour < 23:
                expect(resp.locator("#msg-registro")).to_contain_text("não pode estar no futuro")
            resp.click("#modal-registro button:has-text('Cancelar')")
        passo("Registro no futuro é recusado pelo servidor com mensagem clara", t_futuro)

        def t_horarios():
            resp.click("text=+ Agendar")
            quando = (agora + timedelta(days=1)).strftime("%Y-%m-%dT10:00")
            resp.select_option("#reg-horario-tipo", "MEDICAMENTO")
            resp.fill("#reg-horario-quando", quando)
            resp.fill("#reg-horario-descricao", "Vitamina D")
            resp.fill("#reg-horario-detalhes", "4 gotas")
            resp.click("#form-registro button[type=submit]")
            expect(resp.locator("#lista-horarios")).to_contain_text("Medicamento — Vitamina D • 4 gotas")
            resp.click("#lista-horarios button[title='Marcar como feito']")
            expect(resp.locator("#lista-horarios")).to_contain_text("Nenhum horário previsto")
            expect(resp.locator("#dashboard-timeline .timeline-item")).to_have_count(5)  # concluir não cria registro
        passo("10 e 6.3. Próximos horários: agendar, listar e concluir sem gerar registro de rotina", t_horarios)

        def t_troca_isolamento():
            resp.click("#btn-trocar-bebe")
            resp.click("#lista-trocar-bebe button:has-text('Lia')")
            resp.wait_for_load_state("networkidle")
            expect(resp.locator("#bebe-nome")).to_have_text("Lia")
            expect(resp.locator("[data-foto-ativo]")).to_have_attribute("src", re.compile("bebe-padrao.svg"))
            expect(resp.locator("#dashboard-timeline")).to_contain_text("Nenhuma atividade registrada hoje")
            expect(resp.locator("#resumo-leite")).to_have_text("—")
            resp.goto(f"{FRONT}/rotina.html")
            expect(resp.locator("#bebe-nome")).to_have_text("Lia")  # seleção preservada na navegação
            expect(resp.locator("#lista-atividades")).to_contain_text("Nenhuma atividade registrada neste dia")
        passo("5 e 6. Trocar para o bebê B mostra só os dados de B (atividades de A não aparecem)", t_troca_isolamento)

        def t_contexto_outra_aba():
            # Outra aba troca o bebê: o formulário aberto não grava no bebê errado
            resp.evaluate("""() => { const u = AuthService.getUsuarioLogado();
                const outro = BebeAtivo.lista.find(v => v.bebe.id !== BebeAtivo.idDaTela).bebe.id;
                localStorage.setItem('baba_premium_bebe_' + u.id, String(outro)); }""")
            resp.click("button.quick-action-btn:has-text('Fralda')")
            with resp.expect_navigation():
                resp.click("#form-rotina button[type=submit]")
            expect(resp.locator("#bebe-nome")).to_have_text("Lucas")
            lia = next(m for m in api(resp, "ApiService.bebes.meus()") if m["bebe"]["nome"] == "Lia")["bebe"]["id"]
            assert api(resp, f"ApiService.fraldas.listar({lia})") == [], "fralda gravada no bebê errado"
        passo("Troca em outra aba: formulário pendente é descartado e nada é gravado no bebê errado", t_contexto_outra_aba)

        def t_rotina():
            expect(resp.locator("#lista-atividades .timeline-item")).to_have_count(5)
            resp.click("text=🧷 Fraldas")
            expect(resp.locator("#lista-atividades .timeline-item:visible")).to_have_count(1)
            resp.click(".filter-tab:has-text('Todos')")
            resp.locator("#lista-atividades .timeline-item", has_text="Banho").locator("text=Excluir").click()
            expect(resp.locator("#lista-atividades .timeline-item")).to_have_count(4)
            ontem = (agora - timedelta(days=1)).strftime("%Y-%m-%d")
            resp.fill("#rotina-data-input", ontem)
            resp.dispatch_event("#rotina-data-input", "change")
            expect(resp.locator("#lista-atividades")).to_contain_text("Nenhuma atividade registrada neste dia")
        passo("6.4. Histórico por data com filtro e exclusão", t_rotina)

        # ---------------- Saúde ----------------
        def t_saude():
            resp.goto(f"{FRONT}/saude.html")
            expect(resp.locator("#lista-vacinas")).to_contain_text("Nenhuma vacina registrada")
            def novo(tipo, campos):
                resp.click("text=+ Novo Registro")
                resp.select_option("#saude-tipo", tipo)
                for seletor, valor in campos.items():
                    resp.fill(seletor, valor)
                resp.click("#form-saude button[type=submit]")
                expect(resp.locator("#modal-saude")).to_be_hidden()
            novo("crescimento", {"#cresc-data": "2026-09-01", "#cresc-peso": "6.9", "#cresc-altura": "63"})
            novo("crescimento", {"#cresc-peso": "7.45", "#cresc-altura": "65.5"})
            novo("vacina", {"#vac-nome": "Pentavalente", "#vac-dose": "2ª dose", "#vac-proxima": (agora + timedelta(days=60)).strftime("%Y-%m-%d")})
            novo("medicamento", {"#med-nome": "Vitamina D", "#med-dose": "2 gotas"})
            novo("consulta", {"#cons-quando": (agora + timedelta(days=3)).strftime("%Y-%m-%dT14:30"), "#cons-desc": "Pediatra"})
            expect(resp.locator("#ultimo-peso")).to_have_text("7,45 kg")
            expect(resp.locator("#ultima-altura")).to_have_text("65,5 cm")
            expect(resp.locator("#lista-crescimentos .list-row")).to_have_count(2)  # histórico preservado
            expect(resp.locator("#lista-vacinas")).to_contain_text("Pentavalente")
            expect(resp.locator("#lista-medicamentos")).to_contain_text("Vitamina D")
            expect(resp.locator("#proxima-consulta-desc")).to_have_text("Pediatra")
            # validação: nenhuma medida
            resp.click("text=+ Novo Registro")
            resp.click("#form-saude button[type=submit]")
            expect(resp.locator("#msg-saude")).to_contain_text("ao menos uma medida")
            resp.click("#modal-saude .btn-cancel")
        passo("9. Caderneta: medidas com histórico, vacina, medicamento e consulta", t_saude)

        # ---------------- Diário ----------------
        def t_diario():
            resp.goto(f"{FRONT}/notas.html")
            expect(resp.locator("#container-notas")).to_contain_text("Nenhuma anotação registrada")
            resp.click("text=+ Nova Anotação")
            resp.select_option("#nota-categoria", "MARCO")
            resp.fill("#nota-titulo", "Primeiro sorriso")
            resp.fill("#nota-texto", "Sorriu ao ouvir música.")
            resp.click("#form-nota button[type=submit]")
            expect(resp.locator(".note-card")).to_have_count(1)
            expect(resp.locator(".note-card")).to_contain_text("por Maria Pereira")
            resp.click(".note-card >> text=Editar")
            resp.fill("#nota-texto", "Sorriu ao ouvir música clássica.")
            resp.click("#form-nota button[type=submit]")
            expect(resp.locator(".note-card")).to_contain_text("música clássica")
            expect(resp.locator(".note-card")).to_contain_text("editada")
        passo("8. Diário: criar e editar anotação com autor", t_diario)

        # ---------------- Estatísticas ----------------
        def t_estatisticas():
            resp.goto(f"{FRONT}/estatisticas.html")
            expect(resp.locator("#aviso-estatisticas")).to_contain_text("1 de 7 dias com registros")
            expect(resp.locator("#media-leite")).to_have_text("150 ml")
            expect(resp.locator("#media-sono")).to_have_text("35min")
            expect(resp.locator("#media-fraldas")).to_have_text("1")
            expect(resp.locator("#comparacao-fraldas")).to_contain_text("Sem dados do período anterior")
            grafico_ok = resp.locator("#graficoSono").is_visible()
            print(f"   (gráfico de sono renderizado: {grafico_ok})")
            resp.select_option("#periodo-estatisticas", "30")
            expect(resp.locator("#aviso-estatisticas")).to_contain_text("1 de 30 dias com registros")
        passo("7 e 6.6. Estatísticas do período a partir dos registros reais, sem inventar dias", t_estatisticas)

        # ---------------- Vínculo com a babá e permissões ----------------
        def t_vincular_baba():
            resp.goto(f"{FRONT}/perfil-bebe.html")
            expect(resp.locator("#lista-meus-bebes .list-row")).to_have_count(2)
            expect(resp.locator("text=Abrir bebê pelo código")).to_have_count(0)
            resp.fill("#vinculo-email", email_baba)
            resp.click("#btn-vincular")
            expect(resp.locator("#msg-vinculos")).to_contain_text("vinculado(a) ao bebê")
        passo("7. Perfil lista os bebês da conta (sem 'abrir pelo código') e vincula a babá", t_vincular_baba)

        def t_baba_ve_bebe():
            baba.goto(f"{FRONT}/dashboard.html")
            expect(baba.locator("#bebe-nome")).to_have_text("Lucas")
            expect(baba.locator("#bebe-idade")).to_contain_text("babá")
            # 4 registros de rotina + a Vitamina D registrada na caderneta (medicamentos entram na linha do tempo)
            expect(baba.locator("#dashboard-timeline .timeline-item")).to_have_count(5)
            assert baba.locator("#btn-trocar-bebe").count() == 0  # só um bebê: seletor simplificado
        passo("Babá vinculada passa a ver o bebê (seletor simplificado com uma criança)", t_baba_ve_bebe)

        def t_baba_cadastra():
            baba.goto(f"{FRONT}/perfil-bebe.html")
            expect(baba.locator("#grupo-nome-responsavel")).to_be_visible()
            baba.fill("#novo-nome", "Theo")
            baba.fill("#novo-nasc", "2026-01-10")
            baba.select_option("#novo-sexo", "M")
            baba.fill("#novo-obs", "Usa chupeta")
            baba.evaluate("document.getElementById('novo-responsavel').required = false")  # testa a validação do JS/servidor
            baba.click("#btn-novo-bebe")
            expect(baba.locator("#msg-novo-bebe")).to_contain_text("nome do responsável")
            # servidor também recusa sem o nome
            r = baba.evaluate("""ApiService.bebes.cadastrar({nome:'X', dataNascimento:'2026-01-01', sexo:'M', observacoes:'x'})
                .then(() => 'aceito').catch(e => e.status + ' ' + e.message)""")
            assert r.startswith("400") and "responsável" in r, r
            baba.fill("#novo-responsavel", "Carla Souza")
            baba.locator("#novo-foto input[type=file]").set_input_files(str(foto_nova))
            with baba.expect_navigation():
                baba.click("#btn-novo-bebe")
            expect(baba.locator("#dados-bebe")).to_contain_text("Carla Souza")
            expect(baba.locator("#foto-atual")).to_have_attribute("src", re.compile("^blob:"))
            baba.fill("#busca-nome-resp", "carla")
            baba.click("#form-busca-baba button")
            expect(baba.locator("#lista-bebes-baba .list-row")).to_have_count(1)
            expect(baba.locator("#lista-bebes-baba")).to_contain_text("Theo")
        passo("3 e 4. Babá cadastra bebê: nome do responsável obrigatório (front e back), salvo e exibido, com foto", t_baba_cadastra)

        def t_trocar_foto():
            baba.locator("#input-nova-foto").set_input_files(str(foto_a))
            expect(baba.locator("#previa-nova-foto")).to_be_visible()
            baba.click("#btn-salvar-foto")
            expect(baba.locator("#msg-bebe")).to_contain_text("Foto atualizada")
            baba.click("#btn-remover-foto")
            expect(baba.locator("#msg-bebe")).to_contain_text("Foto removida")
            expect(baba.locator("#foto-atual")).to_have_attribute("src", re.compile("bebe-padrao.svg"))
            baba.reload()
            expect(baba.locator("#foto-atual")).to_have_attribute("src", re.compile("bebe-padrao.svg"))
        passo("4. Trocar e remover foto do bebê persistem após recarregar", t_trocar_foto)

        def t_bloqueio():
            lia = next(m for m in api(resp, "ApiService.bebes.meus()") if m["bebe"]["nome"] == "Lia")["bebe"]["id"]
            r = baba.evaluate(f"ApiService.bebes.obter({lia}).then(() => 'aceito').catch(e => String(e.status))")
            assert r == "403", r
            r = baba.evaluate(f"ApiService.resumo.linhaDoTempo({lia}).then(() => 'aceito').catch(e => String(e.status))")
            assert r == "403", r
            # forçar o id de um bebê não autorizado no navegador não dá acesso
            baba.evaluate(f"localStorage.setItem('baba_premium_bebe_' + AuthService.getUsuarioLogado().id, '{lia}')")
            baba.goto(f"{FRONT}/dashboard.html")
            expect(baba.locator("#bebe-nome")).not_to_have_text("Lia")
            # babá lê a anotação da responsável sobre o Lucas, mas não pode editá-la
            baba.goto(f"{FRONT}/notas.html")
            expect(baba.locator("#bebe-nome")).to_have_text("Lucas")
            expect(baba.locator(".note-card")).to_have_count(1)
            expect(baba.locator(".note-card >> text=Editar")).to_have_count(0)
        passo("11. Acesso a criança não autorizada é bloqueado pelo servidor (403), mesmo alterando o id", t_bloqueio)

        # ---------------- Sessão ----------------
        def t_login():
            pg = nova_pagina()
            pg.goto(f"{FRONT}/login.html")
            pg.fill("#login-email", email_resp)
            pg.fill("#login-senha", "senha-errada")
            pg.click("#btn-login-submit")
            expect(alerta(pg)).to_have_text("E-mail ou senha inválidos.")
            login(pg, email_resp.upper())
            expect(pg.locator("#bebe-nome")).to_be_visible()
            pg.evaluate("localStorage.setItem('baba_premium_token', 'x.eyJleHAiOjF9.y')")  # token expirado/inválido
            pg.goto(f"{FRONT}/saude.html")
            pg.wait_for_url("**/login.html*")
        passo("Login confere a senha no servidor; token inválido/expirado volta para o login", t_login)

        def t_api_offline():
            pg = nova_pagina()
            pg.route(f"{API}/**", lambda r: r.abort())
            pg.goto(f"{FRONT}/login.html")
            pg.fill("#login-email", email_resp)
            pg.fill("#login-senha", SENHA)
            pg.click("#btn-login-submit")
            expect(alerta(pg)).to_contain_text("Não foi possível conectar à API")
        passo("API fora do ar: mensagem de conexão, sem login simulado", t_api_offline)

        browser.close()

    print("\n=== RESULTADOS E2E ===")
    for status, nome in resultados:
        print(f"[{status}] {nome}")
    print("\n=== ERROS DE JAVASCRIPT NO CONSOLE (exceto respostas HTTP de erro esperadas) ===")
    print("\n".join(erros_console) or "(nenhum)")
    return 0 if all(s == "OK" for s, _ in resultados) else 1


if __name__ == "__main__":
    sys.exit(main())
