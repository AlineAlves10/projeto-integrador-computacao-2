package br.com.projeto.repository;

import br.com.projeto.Enum.TipoUsuarioEnum;
import br.com.projeto.model.autenticacao.UsuarioBebe;
import br.com.projeto.model.autenticacao.UsuarioBebeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface UsuarioBebeRepository extends JpaRepository<UsuarioBebe, UsuarioBebeId> {

    List<UsuarioBebe> findByBebeId(Long bebeId);

    boolean existsByUsuarioIdAndBebeId(Long usuarioId, Long bebeId);

    // Evita cadastrar duas vezes o mesmo bebê para o mesmo usuário (ex.: duplo clique no envio)
    boolean existsByUsuarioIdAndBebe_NomeIgnoreCaseAndBebe_DataNascimento(Long usuarioId, String nome, LocalDate dataNascimento);

    // Bebês acessíveis por um usuário, já com os dados do bebê carregados
    @Query("select ub from UsuarioBebe ub join fetch ub.bebe b where ub.usuario.id = :usuarioId order by b.nome")
    List<UsuarioBebe> findByUsuarioIdComBebe(@Param("usuarioId") Long usuarioId);

    // Vínculos do bebê com os dados de cada usuário (lista de contatos)
    @Query("select ub from UsuarioBebe ub join fetch ub.usuario u where ub.bebe.id = :bebeId order by ub.papel desc, u.nome")
    List<UsuarioBebe> findByBebeIdComUsuario(@Param("bebeId") Long bebeId);

    boolean existsByBebeIdAndPapel(Long bebeId, TipoUsuarioEnum papel);

    long countByBebeId(Long bebeId);

    long countByBebeIdAndPapel(Long bebeId, TipoUsuarioEnum papel);

    // Telefone visível: os dois compartilham um bebê e pelo menos um deles é RESPONSAVEL nesse bebê
    // (responsável <-> babá e responsável <-> responsável; babá não vê telefone de outra babá)
    @Query("""
            select count(ub1) > 0 from UsuarioBebe ub1, UsuarioBebe ub2
            where ub1.usuario.id = :visualizador and ub2.usuario.id = :alvo and ub1.bebe.id = ub2.bebe.id
              and (ub1.papel = br.com.projeto.Enum.TipoUsuarioEnum.RESPONSAVEL
                   or ub2.papel = br.com.projeto.Enum.TipoUsuarioEnum.RESPONSAVEL)
            """)
    boolean podeVerTelefone(@Param("visualizador") Long visualizador, @Param("alvo") Long alvo);

    // Dois usuários compartilham algum bebê?
    @Query("""
            select count(ub1) > 0 from UsuarioBebe ub1, UsuarioBebe ub2
            where ub1.usuario.id = :usuarioA and ub2.usuario.id = :usuarioB and ub1.bebe.id = ub2.bebe.id
            """)
    boolean compartilhamBebe(@Param("usuarioA") Long usuarioA, @Param("usuarioB") Long usuarioB);
}
