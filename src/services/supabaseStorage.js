import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vuzcuuofuwvdnsrnapqc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1emN1dW9mdXd2ZG5zcm5hcHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODc0MDQsImV4cCI6MjA4NTc2MzQwNH0.1172AYnqaidcebUdL7D_lRtNCt3iAK5WZFTF9StCW4c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET = 'product-images';

export const uploadProductImage = async (file, businessId) => {
  const ext = file.name.split('.').pop();
  const fileName = `${businessId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) throw new Error(`Error subiendo imagen: ${error.message}`);

  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${data.path}`;
};

export const deleteProductImage = async (imageUrl) => {
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split(`/storage/v1/object/public/${BUCKET}/`);
    if (pathParts.length < 2) return;
    const filePath = decodeURIComponent(pathParts[1]);
    await supabase.storage.from(BUCKET).remove([filePath]);
  } catch (e) {
    console.warn('Could not delete image:', e);
  }
};
