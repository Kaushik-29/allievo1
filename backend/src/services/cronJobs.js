/**
 * Allievo Cron Jobs
 * Scheduled background tasks for disruption monitoring
 */

const cron = require('node-cron');
const { getCurrentReadings, TRIGGER_THRESHOLDS } = require('./disruptionEngine');
const { VALID_CITIES } = require('../utils/validators');

let isRunning = false;

function startCronJobs() {
  // Run every 15 minutes — simulate sensor polling
  cron.schedule('*/15 * * * *', async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      console.log('⏱ [CRON] Polling simulated sensor data...');
      
      for (const city of VALID_CITIES) {
        const readings = await getCurrentReadings(city);
        
        for (const [type, reading] of Object.entries(readings)) {
          // In a real system, this would:
          // 1. Check actual weather/platform APIs
          // 2. Compare against thresholds
          // 3. Create disruption_events in DB if threshold breached
          // 4. Notify affected workers
          // 5. Queue claim validation jobs
          
          if (reading.status === 'TRIGGERED') {
            console.log(`🚨 [CRON] ${type} triggered in ${city}: ${reading.currentValue}`);
          }
        }
      }

      console.log('✅ [CRON] Sensor polling complete');
    } catch (err) {
      console.error('❌ [CRON] Error during sensor polling:', err.message);
    } finally {
      isRunning = false;
    }
  });

  // Daily at midnight — expire old policies
  cron.schedule('0 0 * * *', async () => {
    console.log('⏱ [CRON] Running daily policy expiry check...');
    // In production: UPDATE policies SET status = 'EXPIRED' WHERE week_end_date < NOW() AND status = 'ACTIVE'
  });

  console.log('✅ Cron jobs started (sensor polling every 15 min)');
}

module.exports = { startCronJobs };
