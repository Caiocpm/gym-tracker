import { Router } from 'express';
import { marketplaceController } from '../controllers/marketplace.controller';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate';
import { validate, validateQuery } from '../middleware/validate';
import {
  searchProfessionalsSchema,
  createContactRequestSchema,
  respondContactRequestSchema,
} from '../schemas/marketplace.schemas';

const router = Router();

// ─── Public (no auth) ────────────────────────────────────────────────────────
router.get(
  '/professionals',
  optionalAuthenticate,
  validateQuery(searchProfessionalsSchema),
  marketplaceController.searchProfessionals,
);
router.get('/professionals/:userId',             optionalAuthenticate, marketplaceController.getPublicProfile);
router.get('/professionals/:userId/my-rating',   authenticate, marketplaceController.getMyRating);
router.post('/professionals/:userId/rating',     authenticate, marketplaceController.upsertRating);

// ─── Authenticated client → contact professional ─────────────────────────────
router.post(
  '/professionals/:userId/contact',
  authenticate,
  validate(createContactRequestSchema),
  marketplaceController.createContactRequest,
);

// ─── Authenticated professional → manage contact requests ─────────────────────
router.get('/contact-requests',                              authenticate, marketplaceController.listContactRequests);
router.post('/contact-requests/:requestId/respond',         authenticate, validate(respondContactRequestSchema), marketplaceController.respondToContactRequest);
router.delete('/contact-requests/:requestId',               authenticate, marketplaceController.deleteContactRequest);
router.delete('/contact-requests',                          authenticate, marketplaceController.clearResolvedRequests);

export default router;
