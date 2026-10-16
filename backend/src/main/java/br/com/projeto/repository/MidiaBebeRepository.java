package br.com.projeto.repository;

import br.com.projeto.model.galeria.MidiaBebe;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MidiaBebeRepository extends JpaRepository<MidiaBebe, Long> {

    @EntityGraph(attributePaths = "enviadoPor")
    Page<MidiaBebe> findByBebeIdOrderByDataEnvioDescIdDesc(Long bebeId, Pageable pageable);

    // Busca sempre pelo par (id, bebeId): o id de uma mídia de outro bebê não é encontrado
    @EntityGraph(attributePaths = "enviadoPor")
    Optional<MidiaBebe> findByIdAndBebeId(Long id, Long bebeId);
}
