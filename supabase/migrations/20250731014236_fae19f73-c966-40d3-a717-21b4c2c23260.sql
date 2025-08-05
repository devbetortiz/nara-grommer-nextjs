-- Add client_id column to pets table to link pets to clients
ALTER TABLE public.pets 
ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_pets_client_id ON public.pets(client_id);