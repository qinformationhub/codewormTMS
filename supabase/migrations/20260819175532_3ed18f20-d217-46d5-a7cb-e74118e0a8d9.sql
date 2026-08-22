UPDATE auth.users 
SET email = 'shipper@bf101tms.com', 
    raw_user_meta_data = raw_user_meta_data || '{"email": "shipper@bf101tms.com"}'::jsonb,
    encrypted_password = crypt('password123', gen_salt('bf'))
WHERE email = 'shipper@codeworm.dev';

UPDATE auth.users 
SET email = 'carrier@bf101tms.com', 
    raw_user_meta_data = raw_user_meta_data || '{"email": "carrier@bf101tms.com"}'::jsonb,
    encrypted_password = crypt('password123', gen_salt('bf'))
WHERE email = 'carrier@codeworm.dev';