-- Create policies for admins to view and manage all appointments
CREATE POLICY "Admins can view all appointments" 
ON public.appointments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all appointments" 
ON public.appointments 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all appointments" 
ON public.appointments 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create appointments for any user" 
ON public.appointments 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));