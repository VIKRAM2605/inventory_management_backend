import db from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const addProduct = async (req, res) => {
  try {
    console.log('=== ADD PRODUCT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    if (req.file) {
      console.log('File details:');
      console.log('- Original name:', req.file.originalname);
      console.log('- Filename:', req.file.filename);
      console.log('- Path:', req.file.path);
      console.log('- Size:', req.file.size);
      console.log('- File exists on disk:', fs.existsSync(req.file.path));
    }

    const { name, description, category, brand, price, stock_quantity, sku } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : '/uploads/default-product.jpg';
    
    console.log('Saving image_url as:', image_url);

    const [product] = await db`
      INSERT INTO products (name, description, category, brand, price, stock_quantity, sku, image_url, is_active, created_at, updated_at)
      VALUES (${name}, ${description || null}, ${category}, ${brand || null}, ${price}, ${stock_quantity}, ${sku}, ${image_url}, true, NOW(), NOW())
      RETURNING *
    `;

    // Add full image URL for response
    product.image_url = `http://localhost:8000${product.image_url}`;

    console.log('✅ Product inserted successfully:', product);
    res.status(201).json(product);
  } catch (error) {
    console.error('❌ Add product error:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      console.log('🗑️ Cleaning up uploaded file due to error');
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
        else console.log('✅ Uploaded file deleted successfully');
      });
    }
    
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
    
    if (req.file) {
      console.log('File details:');
      console.log('- Original name:', req.file.originalname);
      console.log('- Filename:', req.file.filename);
      console.log('- Path:', req.file.path);
      console.log('- Size:', req.file.size);
      console.log('- File exists on disk:', fs.existsSync(req.file.path));
    }

    const { id } = req.params;
    const { name, description, category, brand, price, stock_quantity, sku } = req.body;
    
    // Get current product to handle image update
    console.log('Fetching current product with ID:', id);
    const [currentProduct] = await db`
      SELECT * FROM products WHERE id = ${id}
    `;
    
    if (!currentProduct) {
      console.log('❌ Product not found with ID:', id);
      if (req.file) {
        console.log('🗑️ Cleaning up uploaded file - product not found');
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Current product found:', {
      id: currentProduct.id,
      name: currentProduct.name,
      current_image_url: currentProduct.image_url
    });

    let image_url = currentProduct.image_url;
    
    // If new image is uploaded
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
      console.log('New image_url will be:', image_url);
      
      // Delete old image if it exists and isn't the default
      if (currentProduct.image_url && !currentProduct.image_url.includes('default-product.jpg')) {
        const oldImagePath = path.join(__dirname, '../uploads', path.basename(currentProduct.image_url));
        console.log('Attempting to delete old image at:', oldImagePath);
        
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error('❌ Error deleting old image:', err);
          } else {
            console.log('✅ Old image deleted successfully');
          }
        });
      } else {
        console.log('ℹ️ No old image to delete (using default or no previous image)');
      }
    } else {
      console.log('ℹ️ No new image uploaded, keeping existing image_url:', image_url);
    }

    console.log('Updating product with data:', {
      name,
      description,
      category,
      brand,
      price,
      stock_quantity,
      sku,
      image_url
    });

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

    // Add full image URL for response
    updatedProduct.image_url = `http://localhost:8000${updatedProduct.image_url}`;

    console.log('✅ Product updated successfully:', updatedProduct);
    res.json(updatedProduct);
  } catch (error) {
    console.error('❌ Update product error:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      console.log('🗑️ Cleaning up uploaded file due to error');
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
        else console.log('✅ Uploaded file deleted successfully');
      });
    }
    
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

    const [deletedProduct] = await db`
      UPDATE products 
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!deletedProduct) {
      console.log('❌ Product not found with ID:', id);
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('✅ Product deactivated successfully:', {
      id: deletedProduct.id,
      name: deletedProduct.name,
      is_active: deletedProduct.is_active
    });

    res.json({ message: 'Product deactivated successfully' });
  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({ error: error.message });
  }
};
