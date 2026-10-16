package br.com.projeto.repository;

import br.com.projeto.model.rotina.RegistroSono;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroSonoRepository extends JpaRepository<RegistroSono, Long> {

    List<RegistroSono> findByBebeIdAndInicioGreaterThanEqualAndInicioLessThanOrderByInicio(
            Long bebeId, LocalDateTime inicio, LocalDateTime fim);

    boolean existsByBebeIdAndFimIsNull(Long bebeId);

    Optional<RegistroSono> findByIdAndBebeId(Long id, Long bebeId);
}
