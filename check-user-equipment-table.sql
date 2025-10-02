-- Check and create user_equipment table if needed
-- This script ensures the user_equipment table exists and has the correct structure

-- Check if user_equipment table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_equipment'
ORDER BY ordinal_position;

-- If the table doesn't exist or is missing columns, create/alter it
CREATE TABLE IF NOT EXISTS public.user_equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    helmet_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    chest_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    legs_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    boots_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    gloves_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    weapon_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    accessory_item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_equipment_user_id ON public.user_equipment(user_id);

-- Check if there are any equipment records
SELECT COUNT(*) as equipment_count FROM user_equipment;

-- Check if there are any equipment records for a specific user (replace with actual user ID)
-- SELECT * FROM user_equipment WHERE user_id = 'USER_ID_HERE';

-- Test inserting a sample equipment record (uncomment if needed)
-- INSERT INTO user_equipment (user_id) VALUES ('USER_ID_HERE') ON CONFLICT (user_id) DO NOTHING;
