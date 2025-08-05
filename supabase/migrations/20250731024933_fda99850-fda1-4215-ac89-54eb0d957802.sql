-- Adicionar foreign key constraint entre pets e clients
ALTER TABLE pets 
ADD CONSTRAINT fk_pets_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Criar índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_pets_client_id ON pets(client_id);