-- Remover policies antigas baseadas em user_id direto para pets
DROP POLICY IF EXISTS "Users can create their own pets" ON pets;
DROP POLICY IF EXISTS "Users can view their own pets" ON pets;
DROP POLICY IF EXISTS "Users can update their own pets" ON pets;
DROP POLICY IF EXISTS "Users can delete their own pets" ON pets;

-- Criar novas policies baseadas na relação através de clients
-- Users podem ver pets dos seus clients
CREATE POLICY "Users can view pets of their clients" ON pets
FOR SELECT USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Users podem criar pets para seus clients
CREATE POLICY "Users can create pets for their clients" ON pets
FOR INSERT WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Users podem atualizar pets dos seus clients
CREATE POLICY "Users can update pets of their clients" ON pets
FOR UPDATE USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Users podem deletar pets dos seus clients
CREATE POLICY "Users can delete pets of their clients" ON pets
FOR DELETE USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Manter as policies de admin
-- (já existem, não precisam ser recriadas)