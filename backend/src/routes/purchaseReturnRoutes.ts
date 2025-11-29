import express from 'express';
import { PurchaseReturnController } from '../controllers/purchaseReturnController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all returns
router.get('/', PurchaseReturnController.getAllReturns);

// Create a new purchase return
router.post('/', PurchaseReturnController.createReturn);

// Get return by ID
router.get('/:id', PurchaseReturnController.getReturnById);

// Get all returns for a purchase order
router.get('/purchase-order/:poId', PurchaseReturnController.getReturnsByPO);

// Confirm a purchase return (deduct stock, process refund/replacement)
router.put('/:id/confirm', PurchaseReturnController.confirmReturn);

// Reject a purchase return
router.put('/:id/reject', PurchaseReturnController.rejectReturn);

// Process refund for a confirmed return
router.post('/:id/process-refund', PurchaseReturnController.processRefund);

export default router;
