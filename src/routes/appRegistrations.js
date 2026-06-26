const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  create,
  list,
  getOne,
  update,
  remove,
  rotateKey,
  resolveDeepLink
} = require('../controllers/appRegistrationController');

// All CRUD routes require a logged-in user
router.post('/', authenticate, create);
router.get('/', authenticate, list);
router.get('/:id', authenticate, getOne);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);
router.post('/:id/rotate-key', authenticate, rotateKey);

module.exports = router;
