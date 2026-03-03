const fs = require('fs');
const data = JSON.parse(fs.readFileSync('../whatssend-w6tu-log-export-2026-03-03T00-11-44.json', 'utf8'));

// Find logs that are related to successful parsing
const successLogs = data
  .filter(log => log.message.includes('Webhook'))
  .map(log => log.message);

// Let's print the last 30 webhook logs to trace a full request
console.log('--- Ultimos 30 logs del Webhook ---');
successLogs.slice(-30).forEach(m => console.log(m));
