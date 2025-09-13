import express from 'express';
import upload, { uploadToSupabase, deleteFromSupabase } from '../config/multer.js';
import { addProduct, updateProduct, deleteProduct } from '../controllers/inventoryController.js';

const router = express.Router();

router.post('/', upload.single('image'), addProduct);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
