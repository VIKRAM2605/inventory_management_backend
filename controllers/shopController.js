import db from '../config/db.js';

export const getShopSettings = async (req, res) => {
  try {
    const [shopSettings] = await db`
      SELECT * FROM shop_settings 
      ORDER BY id DESC 
      LIMIT 1
    `;
    
    if (!shopSettings) {
      return res.status(404).json({ error: 'Shop settings not found' });
    }
    
    res.json(shopSettings);
  } catch (error) {
    console.error('Error fetching shop settings:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateShopSettings = async (req, res) => {
  try {
    const {
      shop_name,
      address_line1,
      address_line2,
      phone,
      email,
      website,
      gst_number
    } = req.body;

    const [updatedSettings] = await db`
      UPDATE shop_settings 
      SET 
        shop_name = ${shop_name},
        address_line1 = ${address_line1},
        address_line2 = ${address_line2},
        phone = ${phone},
        email = ${email},
        website = ${website},
        gst_number = ${gst_number},
        updated_at = NOW()
      WHERE id = (SELECT id FROM shop_settings ORDER BY id DESC LIMIT 1)
      RETURNING *
    `;

    if (!updatedSettings) {
      return res.status(404).json({ error: 'Shop settings not found' });
    }

    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating shop settings:', error);
    res.status(500).json({ error: error.message });
  }
};
