import db from '../config/db.js';
import { uploadToSupabase, deleteFromSupabase } from '../config/multer.js';

export const addProduct = async (req, res) => {
  try {
    console.log('=== ADD PRODUCT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    const { name, description, category, brand, price, stock_quantity, sku } = req.body;
    let image_url = null;

    // Handle file upload to Supabase if file exists
    if (req.file) {
      // In your addProduct controller, before calling uploadToSupabase
      if (req.file) {
        console.log('=== FILE DEBUG ===');
        console.log('File object keys:', Object.keys(req.file));
        console.log('Buffer exists:', !!req.file.buffer);
        console.log('Buffer size:', req.file.buffer ? req.file.buffer.length : 'NO BUFFER');
        console.log('File size from multer:', req.file.size);

        // Check if buffer matches expected size
        if (req.file.buffer && req.file.buffer.length !== req.file.size) {
          console.warn('⚠️ Buffer size mismatch!');
        }
      }

      console.log('Uploading file to Supabase...');
      const uploadResult = await uploadToSupabase(req.file, 'products');
      image_url = uploadResult.publicUrl;
      console.log('File uploaded successfully:', image_url);
    }

    const [product] = await db`
      INSERT INTO products (name, description, category, brand, price, stock_quantity, sku, image_url, is_active, created_at, updated_at)
      VALUES (${name}, ${description || null}, ${category}, ${brand || null}, ${price}, ${stock_quantity}, ${sku}, ${image_url}, true, NOW(), NOW())
      RETURNING *
    `;

    console.log('✅ Product inserted successfully:', product);
    res.status(201).json(product);
  } catch (error) {
    console.error('❌ Add product error:', error);

    if (error.code === '23505') {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    console.log('=== UPDATE PRODUCT REQUEST ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    const { id } = req.params;
    const { name, description, category, brand, price, stock_quantity, sku } = req.body;

    // Get current product
    const [currentProduct] = await db`
      SELECT * FROM products WHERE id = ${id}
    `;

    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let image_url = currentProduct.image_url;
    let oldFilePath = null;

    // If new image is uploaded
    if (req.file) {
      console.log('Uploading new file to Supabase...');
      const uploadResult = await uploadToSupabase(req.file, 'products');

      // Store old file path for deletion
      if (currentProduct.image_url) {
        // Extract file path from URL for deletion
        const urlParts = currentProduct.image_url.split('/');
        const bucketIndex = urlParts.findIndex(part => part === 'product-images');
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
          oldFilePath = urlParts.slice(bucketIndex + 1).join('/');
        }
      }

      image_url = uploadResult.publicUrl;
      console.log('New file uploaded successfully:', image_url);
    }

    const [updatedProduct] = await db`
      UPDATE products 
      SET 
        name = ${name},
        description = ${description || null},
        category = ${category},
        brand = ${brand || null},
        price = ${price},
        stock_quantity = ${stock_quantity},
        sku = ${sku},
        image_url = ${image_url},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    // Delete old image from Supabase if a new one was uploaded
    if (oldFilePath && req.file) {
      try {
        await deleteFromSupabase(oldFilePath);
        console.log('✅ Old image deleted successfully');
      } catch (deleteError) {
        console.error('❌ Error deleting old image:', deleteError);
        // Don't fail the update if image deletion fails
      }
    }

    console.log('✅ Product updated successfully:', updatedProduct);
    res.json(updatedProduct);
  } catch (error) {
    console.error('❌ Update product error:', error);

    if (error.code === '23505') {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    console.log('=== DELETE PRODUCT REQUEST ===');
    console.log('Request params:', req.params);

    const { id } = req.params;

    // Get current product to extract image path
    const [currentProduct] = await db`
      SELECT * FROM products WHERE id = ${id}
    `;

    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [deletedProduct] = await db`
      UPDATE products 
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    // Optionally delete image from Supabase Storage
    if (currentProduct.image_url) {
      try {
        const urlParts = currentProduct.image_url.split('/');
        const bucketIndex = urlParts.findIndex(part => part === 'product-images');
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          await deleteFromSupabase(filePath);
          console.log('✅ Product image deleted from Supabase');
        }
      } catch (deleteError) {
        console.error('❌ Error deleting image from Supabase:', deleteError);
        // Don't fail the product deletion if image deletion fails
      }
    }

    console.log('✅ Product deactivated successfully');
    res.json({ message: 'Product deactivated successfully' });
  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({ error: error.message });
  }
};
