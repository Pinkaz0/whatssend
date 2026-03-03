const fs = require('fs');

const data = JSON.parse(fs.readFileSync('../whatssend-w6tu-log-export-2026-03-03T00-11-44.json', 'utf8'));

// Filter logs containing "Missing remoteJid" or "Payload extra"
const filtered = data
  .filter(log => log.message.includes('Missing remoteJid') || log.message.includes('Payload extra') || log.message.includes('SKIP:'))
  .map(log => log.message);

console.log('--- Logs con Missing/SKIP ---');
filtered.forEach(m => console.log(m));

// Let's also find the first payload dump if any
const payloads = data
  .filter(log => log.message.includes('Body parsed.'))
  .slice(0, 3)
  .map(log => log.message);

console.log('\n--- Muestra de Body Parsed ---');
payloads.forEach(p => console.log(p));
