package br.com.projeto.repository.specification;

import br.com.projeto.Enum.FaixaEtariaEnum;
import br.com.projeto.model.autenticacao.Bebe;
import br.com.projeto.model.autenticacao.Usuario;
import br.com.projeto.model.autenticacao.UsuarioBebe;
import br.com.projeto.Enum.TipoUsuarioEnum;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class BebeSpecification {

    // Nome do bebê
    public Specification<Bebe> procurarBebePorNome(String nomeBebe) {

        return (root, query, criteria) -> {

            if (nomeBebe == null || nomeBebe.isBlank()) {
                return criteria.conjunction();
            }

            return criteria.like(
                    criteria.lower(root.get("nome")), "%" + nomeBebe.toLowerCase() + "%");
        };
    }


    // Nome do responsável: usuário vinculado como RESPONSAVEL ou o nome informado no cadastro (Bebe.nomeResponsavel),
    // que cobre bebês cadastrados por babás antes de o responsável ter conta
    public Specification<Bebe> procurarBebePorNomeResponsavel(
            String nomeResponsavel) {

        return (root, query, criteria) -> {

            String padrao = "%" + nomeResponsavel.toLowerCase() + "%";

            Subquery<Long> responsaveis = query.subquery(Long.class);
            Root<UsuarioBebe> usuarioBebe = responsaveis.from(UsuarioBebe.class);
            Join<UsuarioBebe, Usuario> usuario = usuarioBebe.join("usuario");
            responsaveis.select(usuarioBebe.get("bebe").get("id")).where(
                    criteria.equal(usuarioBebe.get("bebe").get("id"), root.get("id")),
                    criteria.equal(usuarioBebe.get("papel"), TipoUsuarioEnum.RESPONSAVEL),
                    criteria.like(criteria.lower(usuario.get("nome")), padrao));

            return criteria.or(
                    criteria.like(criteria.lower(root.get("nomeResponsavel")), padrao),
                    criteria.exists(responsaveis));
        };
    }

    // Buscar por ID do bebê
    public Specification<Bebe> procurarPorId(Long idBebe) {
        return (root, query, criteria) -> criteria.equal(root.get("id"), idBebe);
    }


    // Bebês vinculados a uma babá específica
    public Specification<Bebe> bebesDaBaba(Long idBaba) {

        return (root, query, criteria) -> {

            Join<Bebe, UsuarioBebe> usuarioBebe = root.join("usuariosBebes");

            Join<UsuarioBebe, Usuario> usuario = usuarioBebe.join("usuario");

            return criteria.and(
                    criteria.equal(usuario.get("id"), idBaba),
                    criteria.equal(usuarioBebe.get("papel"), "BABA")
            );
        };
    }


    // Buscar por faixa etária
    public Specification<Bebe> procurarPorFaixaEtaria(
            FaixaEtariaEnum faixaEtaria) {

        return (root, query, criteria) -> {

            if (faixaEtaria == null) {
                return criteria.conjunction();
            }

            LocalDate hoje = LocalDate.now();

            LocalDate dataInicial;
            LocalDate dataFinal;

            switch (faixaEtaria) {

                case ZERO_A_TRES_MESES -> {
                    dataInicial = hoje.minusMonths(3);
                    dataFinal = hoje;
                }

                case QUATRO_A_SEIS_MESES -> {
                    dataInicial = hoje.minusMonths(6);
                    dataFinal = hoje.minusMonths(3).minusDays(1);
                }

                case SETE_A_DOZE_MESES -> {
                    dataInicial = hoje.minusYears(1);
                    dataFinal = hoje.minusMonths(6).minusDays(1);
                }

                case UM_A_DOIS_ANOS -> {
                    dataInicial = hoje.minusYears(2);
                    dataFinal = hoje.minusYears(1).minusDays(1);
                }

                case DOIS_A_TRES_ANOS -> {
                    dataInicial = hoje.minusYears(3);
                    dataFinal = hoje.minusYears(2).minusDays(1);
                }

                case TRES_ANOS_OU_MAIS -> {
                    dataInicial = LocalDate.MIN;
                    dataFinal = hoje.minusYears(3).minusDays(1);
                }

                default -> throw new IllegalArgumentException(
                        "Faixa etária inválida"
                );
            }

            return criteria.between(
                    root.get("dataNascimento"),
                    dataInicial,
                    dataFinal
            );
        };
    }
}