import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== SUPABASE CLIENT DEBUG ===');
console.log('URL:', supabaseUrl);
console.log('Key starts with:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING');
console.log('Key type:', supabaseKey && supabaseKey.startsWith('eyJ') ? 'JWT (good)' : 'Not JWT');

// Create client with explicit auth settings for server-side use
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

// File filter (keep your existing logic)
const fileFilter = (req, file, cb) => {
  console.log('File filter called for:', file.originalname, 'Type:', file.mimetype);
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer for Supabase
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// In your uploadToSupabase function, create a fresh client every time
export const uploadToSupabase = async (file, folder = 'products') => {
  try {
    // Create a fresh client for this upload operation
    const storageSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('=== SUPABASE UPLOAD DEBUG ===');
    console.log('File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferExists: !!file.buffer,
      bufferLength: file.buffer ? file.buffer.length : 0
    });

    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${folder}/${fileName}`;

    console.log('Uploading to path:', filePath);

    // Use the fresh client for upload
    const { data, error } = await storageSupabase.storage
      .from('product-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      });

    console.log('Upload result:', { data, error });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Get public URL using the same fresh client
    const { data: publicUrlData } = storageSupabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrlData.publicUrl);

    return {
      success: true,
      fileName: fileName,
      filePath: filePath,
      publicUrl: publicUrlData.publicUrl,
      data: data
    };

  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};


// Helper function to delete from Supabase Storage
export const deleteFromSupabase = async (filePath) => {
  try {
    console.log('Deleting from Supabase:', filePath);

    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    console.log('Delete successful');
    return { success: true };

  } catch (error) {
    console.error('Delete from Supabase failed:', error);
    throw error;
  }
};

export default upload;
