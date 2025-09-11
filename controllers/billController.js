import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const createBill = async (req, res) => {
    try {
        const { customer_name, items, discount_percentage, total_amount, billed_by, payment_method, phone_number } = req.body;

        const billId = uuidv4();

        // Start transaction
        await db.begin(async sql => {
            // Create bill
            const [bill] = await sql`
        INSERT INTO bills (id, customer_name,phone_number, discount_percentage, total_amount, created_at,billed_by,payment_method)
        VALUES (${billId}, ${customer_name},${phone_number}, ${discount_percentage}, ${total_amount}, NOW(),${billed_by},${payment_method || "cash"})
        RETURNING *
      `;

            // Create bill items
            for (const item of items) {
                await sql`
          INSERT INTO bill_items (bill_id, product_id, quantity, unit_price, total_price)
          VALUES (${billId}, ${item.product_id}, ${item.quantity}, ${item.unit_price}, ${item.total_price})
        `;

                // Update product stock
                await sql`
          UPDATE products 
          SET stock_quantity = stock_quantity - ${item.quantity}
          WHERE id = ${item.product_id} AND stock_quantity >= ${item.quantity}
        `;
            }

            res.json(bill);
        });
    } catch (error) {
        console.error('Error creating bill:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getAllBills = async (req, res) => {
    try {
        const bills = await db`
      SELECT 
        b.*,
        json_agg(
          json_build_object(
            'id', bi.id,
            'quantity', bi.quantity,
            'unit_price', bi.unit_price,
            'total_price', bi.total_price,
            'product', json_build_object(
              'id', p.id,
              'name', p.name,
              'category', p.category,
              'brand', p.brand
            )
          )
        ) as bill_items
      FROM bills b
      LEFT JOIN bill_items bi ON b.id = bi.bill_id
      LEFT JOIN products p ON bi.product_id = p.id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `;

        res.json(bills);
    } catch (error) {
        console.error('Error fetching bills:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getBillById = async (req, res) => {
    try {
        const { id } = req.params;

        const [bill] = await db`
      SELECT 
        b.*,
        json_agg(
          json_build_object(
            'id', bi.id,
            'quantity', bi.quantity,
            'unit_price', bi.unit_price,
            'total_price', bi.total_price,
            'product', json_build_object(
              'id', p.id,
              'name', p.name,
              'category', p.category,
              'brand', p.brand
            )
          )
        ) as bill_items
      FROM bills b
      LEFT JOIN bill_items bi ON b.id = bi.bill_id
      LEFT JOIN products p ON bi.product_id = p.id
      WHERE b.id = ${id}
      GROUP BY b.id
    `;

        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        res.json(bill);
    } catch (error) {
        console.error('Error fetching bill:', error);
        res.status(500).json({ error: error.message });
    }
};
