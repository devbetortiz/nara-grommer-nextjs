-- Add admin policies for pets table
CREATE POLICY "Admins can view all pets" 
ON public.pets 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create pets for any user" 
ON public.pets 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all pets" 
ON public.pets 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all pets" 
ON public.pets 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));