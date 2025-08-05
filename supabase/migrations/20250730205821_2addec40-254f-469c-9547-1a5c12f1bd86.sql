-- Create pets table
CREATE TABLE public.pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  weight DECIMAL(5,2),
  color TEXT,
  gender TEXT CHECK (gender IN ('macho', 'fêmea')),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
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

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pets_updated_at
BEFORE UPDATE ON public.pets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for pet photos
INSERT INTO storage.buckets (id, name, public) VALUES ('pet-photos', 'pet-photos', true);

-- Create storage policies for pet photos
CREATE POLICY "Users can view pet photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pet-photos');

CREATE POLICY "Users can upload their own pet photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pet-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own pet photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pet-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own pet photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pet-photos' AND auth.uid()::text = (storage.foldername(name))[1]);