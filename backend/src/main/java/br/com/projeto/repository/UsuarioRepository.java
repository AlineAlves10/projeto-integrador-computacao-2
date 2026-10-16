package br.com.projeto.repository;

import br.com.projeto.model.autenticacao.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    // Usuários que compartilham ao menos um bebê com o usuário informado (incluindo ele mesmo)
    @Query("""
            select distinct u from Usuario u
            where u.id = :usuarioId
               or u.id in (select ub2.usuario.id from UsuarioBebe ub1, UsuarioBebe ub2
                           where ub1.usuario.id = :usuarioId and ub2.bebe.id = ub1.bebe.id)
            order by u.nome
            """)
    List<Usuario> findUsuariosRelacionados(@Param("usuarioId") Long usuarioId);
}
