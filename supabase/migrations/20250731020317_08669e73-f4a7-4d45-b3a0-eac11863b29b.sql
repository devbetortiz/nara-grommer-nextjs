-- Add unique constraint to CPF in clients table
ALTER TABLE public.clients ADD CONSTRAINT clients_cpf_unique UNIQUE (cpf);

-- Add unique constraint to user_id to ensure one client per user
ALTER TABLE public.clients ADD CONSTRAINT clients_user_id_unique UNIQUE (user_id);