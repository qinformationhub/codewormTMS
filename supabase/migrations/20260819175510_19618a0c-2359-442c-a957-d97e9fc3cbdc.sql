UPDATE auth.users 
SET email = 'admin@bf101tms.com', 
    raw_user_meta_data = raw_user_meta_data || '{"email": "admin@bf101tms.com"}'::jsonb,
    encrypted_password = crypt('password123', gen_salt('bf'))
WHERE email = 'admin@codeworm.dev';