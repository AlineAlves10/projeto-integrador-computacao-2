-- Executado a cada inicialização, após o Hibernate (ddl-auto=update) criar/atualizar as tabelas.
-- O ddl-auto=update não remove restrições NOT NULL de colunas existentes; estes comandos são idempotentes.

-- Sono "em andamento": fim passa a ser opcional
ALTER TABLE IF EXISTS registros_sono ALTER COLUMN fim DROP NOT NULL;
