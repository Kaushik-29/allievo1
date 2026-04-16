/**
 * Worker Routes — GET/PATCH /api/workers/:id
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// Reference to demo workers (set from server.js)
let getDemoWorkers = () => [];

router.setDemoWorkers = (fn) => { getDemoWorkers = fn; };

// GET /api/workers/:id — Worker profile
router.get('/:id', authMiddleware, (req, res) => {
  const worker = getDemoWorkers().find(w => w.id === req.params.id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found.' });
  }
  const { password_hash, ...safeWorker } = worker;
  res.json({ worker: safeWorker });
});

// PATCH /api/workers/:id — Update zone, UPI ID
router.patch('/:id', authMiddleware, (req, res) => {
  const worker = getDemoWorkers().find(w => w.id === req.params.id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found.' });
  }

  if (req.user.id !== worker.id) {
    return res.status(403).json({ error: 'You can only update your own profile.' });
  }

  const { zone, upiId } = req.body;
  if (zone) worker.zone = zone;
  if (upiId) worker.upi_id = upiId;
  worker.updated_at = new Date().toISOString();

  const { password_hash, ...safeWorker } = worker;
  res.json({ message: 'Profile updated', worker: safeWorker });
});

module.exports = router;
