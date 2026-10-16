package br.com.projeto.repository;

import br.com.projeto.Enum.StatusHorarioPrevistoEnum;
import br.com.projeto.Enum.TipoHorarioPrevistoEnum;
import br.com.projeto.model.agenda.HorarioPrevisto;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HorarioPrevistoRepository extends JpaRepository<HorarioPrevisto, Long> {

    @EntityGraph(attributePaths = "criadoPor")
    List<HorarioPrevisto> findByBebeIdAndStatusAndDataHoraPrevistaGreaterThanEqualOrderByDataHoraPrevista(
            Long bebeId, StatusHorarioPrevistoEnum status, LocalDateTime desde, Limit limite);

    @EntityGraph(attributePaths = "criadoPor")
    List<HorarioPrevisto> findByBebeIdAndDataHoraPrevistaGreaterThanEqualOrderByDataHoraPrevista(
            Long bebeId, LocalDateTime desde, Limit limite);

    Optional<HorarioPrevisto> findFirstByBebeIdAndTipoAndStatusAndDataHoraPrevistaGreaterThanEqualOrderByDataHoraPrevista(
            Long bebeId, TipoHorarioPrevistoEnum tipo, StatusHorarioPrevistoEnum status, LocalDateTime desde);

    @EntityGraph(attributePaths = "criadoPor")
    Optional<HorarioPrevisto> findByIdAndBebeId(Long id, Long bebeId);
}
