import express from 'express';
import { SalesReturnController } from '../controllers/salesReturnController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get eligible invoices for return (must be before /:id route)
router.get('/eligible-invoices', SalesReturnController.getEligibleInvoices);

// Get all returns for an invoice (must be before /:id route)
router.get('/invoice/:invoiceId', SalesReturnController.getReturnsByInvoice);

// Get all returns
router.get('/', SalesReturnController.getAllReturns);

// Create a new sales return
router.post('/', SalesReturnController.createReturn);

// Get return by ID
router.get('/:id', SalesReturnController.getReturnById);

// Confirm a sales return
router.put('/:id/confirm', SalesReturnController.confirmReturn);

// Reject a sales return
router.put('/:id/reject', SalesReturnController.rejectReturn);

// Process refund for a confirmed return
router.post('/:id/refund', SalesReturnController.processRefund);

export default router;
