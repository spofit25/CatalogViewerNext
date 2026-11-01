// Helpers for reading/writing product images in Supabase Storage.
import { supabase } from './supabase';

const BUCKET = 'sub-product-images';

export const uploadImage = async (file: File): Promise<string | null> => {
  if (!file) return null;

  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file');
    return null;
  }

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('storage: upload error:', error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
};

export const deleteImage = async (fileName: string): Promise<boolean> => {
  if (!fileName) return true;

  const { error } = await supabase.storage.from(BUCKET).remove([fileName]);

  if (error) {
    console.error('storage: delete error:', error.message);
    return false;
  }
  return true;
};

/** Extract the object path (everything after the bucket name) from a public URL. */
export const publicUrlToPath = (publicUrl: string): string => {
  try {
    const urlObj = new URL(publicUrl);
    const parts = urlObj.pathname.split(`/${BUCKET}/`);
    return parts.length > 1 ? parts[1] : '';
  } catch {
    return '';
  }
};

export const getSignedUrl = async (filePath: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600); // valid for 1 hour

  if (error) {
    console.error('storage: signed url error:', error.message);
    throw error;
  }
  return data.signedUrl;
};

export { BUCKET };
