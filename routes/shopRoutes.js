import express from 'express';
import { getShopSettings, updateShopSettings } from '../controllers/shopController.js';

const router = express.Router();

router.get('/shop-settings', getShopSettings);
router.put('/shop-settings', updateShopSettings);

export default router;
