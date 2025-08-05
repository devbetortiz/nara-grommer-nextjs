-- Adicionar policy de DELETE para admins na tabela profiles
CREATE POLICY "Admins can delete all profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));