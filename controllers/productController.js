import db from '../config/db.js';

export const getAllProducts = async (req, res) => {
  try {
    const products = await db`
      SELECT 
        id,
        name,
        description,
        category,
        brand,
        price,
        stock_quantity,
        sku,
        image_url,
        is_active,
        created_at,
        updated_at
      FROM products 
      WHERE is_active = true 
      ORDER BY name ASC
    `;

    // Products now have direct Supabase Storage URLs, just return them as-is
    const productsWithImages = products.map(product => ({
      ...product,
      // image_url is already the full Supabase Storage URL from the upload process
      image_url: product.image_url || null // Keep null if no image
    }));

    res.json(productsWithImages);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [product] = await db`
      SELECT * FROM products 
      WHERE id = ${id} AND is_active = true
    `;
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // image_url is already the full Supabase Storage URL, no need to modify
    // Just keep it as-is or set to null if empty
    product.image_url = product.image_url || null;
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const [updatedProduct] = await db`
      UPDATE products 
      SET stock_quantity = ${quantity}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // image_url is already the full Supabase Storage URL, no need to modify
    updatedProduct.image_url = updatedProduct.image_url || null;

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ error: error.message });
  }
};
