-- Primeiro, remover todas as policies da tabela pets que dependem de client_id
DROP POLICY IF EXISTS "Users can view pets of their clients" ON public.pets;
DROP POLICY IF EXISTS "Users can create pets for their clients" ON public.pets;
DROP POLICY IF EXISTS "Users can update pets of their clients" ON public.pets;
DROP POLICY IF EXISTS "Users can delete pets of their clients" ON public.pets;

-- Adicionar os campos de cliente à tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact text;

-- Migrar dados existentes da tabela clients para profiles
UPDATE public.profiles 
SET 
  full_name = COALESCE(profiles.full_name, clients.full_name),
  phone = COALESCE(profiles.phone, clients.phone),
  cpf = clients.cpf,
  address = clients.address,
  emergency_contact = clients.emergency_contact
FROM public.clients 
WHERE profiles.id = clients.user_id;

-- Atualizar a tabela pets para referenciar diretamente o user_id em vez de client_id
UPDATE public.pets 
SET user_id = clients.user_id
FROM public.clients 
WHERE pets.client_id = clients.id;

-- Agora podemos remover a coluna client_id da tabela pets
ALTER TABLE public.pets DROP COLUMN client_id;

-- Criar novas policies para pets baseadas em user_id
CREATE POLICY "Users can view their own pets" 
ON public.pets 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own pets" 
ON public.pets 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pets" 
ON public.pets 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own pets" 
ON public.pets 
FOR DELETE 
USING (user_id = auth.uid());

-- Remover a tabela clients (já que os dados foram migrados para profiles)
DROP TABLE public.clients;