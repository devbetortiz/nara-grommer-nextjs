-- Cadastrar alberto.ortiz.medeiros@gmail.com como administrador
-- User ID: a0ca2d16-12a1-4ee8-b1c4-1434797d4277

INSERT INTO public.user_roles (user_id, role)
VALUES ('a0ca2d16-12a1-4ee8-b1c4-1434797d4277', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;