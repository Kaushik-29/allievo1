/**
 * Disruption Routes — GET/POST /api/disruptions
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { simulateDisruption, getCurrentReadings, evaluateTrigger } = require('../services/disruptionEngine');
const { validateDisruptionType } = require('../utils/validators');

// In-memory store for demo
const demoDisruptions = [];

let getDemoWorkers = () => [];
router.setDemoWorkers = (fn) => { getDemoWorkers = fn; };

// POST /api/disruptions/simulate — Simulate a disruption
router.post('/simulate', authMiddleware, (req, res, next) => {
  try {
    const { disruptionType } = req.body;

    if (!validateDisruptionType(disruptionType)) {
      return res.status(400).json({ error: 'Invalid disruption type.' });
    }

    const worker = getDemoWorkers().find(w => w.id === req.user.id);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found.' });
    }

    // Simulate the disruption
    const disruption = simulateDisruption(disruptionType, worker.city, worker.zone);

    const event = {
      id: uuidv4(),
      disruption_type: disruption.disruptionType,
      city: disruption.city,
      zone: disruption.zone,
      sensor_value: disruption.sensorValue,
      threshold_value: disruption.thresholdValue,
      severity: disruption.severity,
      status: 'TRIGGERED',
      event_start: new Date().toISOString(),
      event_end: null,
      verified: false,
      created_at: new Date().toISOString(),
    };

    demoDisruptions.push(event);

    res.json({
      message: `${disruptionType} disruption simulated in ${worker.zone}, ${worker.city}`,
      event,
      icon: disruption.icon,
      description: disruption.description,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/disruptions — List disruptions for worker's city
router.get('/', authMiddleware, (req, res) => {
  const worker = getDemoWorkers().find(w => w.id === req.user.id);
  const city = worker?.city || req.query.city;

  const disruptions = demoDisruptions
    .filter(d => !city || d.city === city)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);

  res.json({ disruptions, count: disruptions.length });
});

// GET /api/disruptions/readings — Current sensor readings
router.get('/readings', authMiddleware, async (req, res) => {
  const worker = getDemoWorkers().find(w => w.id === req.user.id);
  const readings = await getCurrentReadings(worker?.city || 'Mumbai');
  res.json({ readings, city: worker?.city || 'Mumbai' });
});

// Export for access
router.getDemoDisruptions = () => demoDisruptions;

module.exports = router;
