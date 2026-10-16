package br.com.projeto.repository;

import br.com.projeto.model.saude.RegistroMedicamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistroMedicamentoRepository extends JpaRepository<RegistroMedicamento, Long> {

    List<RegistroMedicamento> findByBebeIdAndDataHoraGreaterThanEqualAndDataHoraLessThanOrderByDataHora(
            Long bebeId, LocalDateTime inicio, LocalDateTime fim);

    List<RegistroMedicamento> findByBebeIdOrderByDataHoraDesc(Long bebeId);

    Optional<RegistroMedicamento> findByIdAndBebeId(Long id, Long bebeId);
}
