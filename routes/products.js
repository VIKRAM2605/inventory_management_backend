import express from 'express';
import { getAllProducts, getProductById, updateProductStock } from '../controllers/productController.js';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.patch('/:id/stock', updateProductStock);

export default router;
