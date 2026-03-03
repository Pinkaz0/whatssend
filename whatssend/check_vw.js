import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkEvolutionWebhook() {
  const instanceName = 'whatsventas-1772495175089-0swy';
  const apiUrl = process.env.EVOLUTION_API_URL || 'https://api.empathaiapp.net';
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!apiKey) {
    console.error('No API Key');
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/webhook/find/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey
      }
    });
    
    if (response.ok) {
        const data = await response.json();
        console.log('Webhook actual de la instancia', instanceName, ':', JSON.stringify(data, null, 2));
    } else {
        console.error('Error fetching webhook:', response.status, await response.text());
    }
  } catch (err) {
    console.error(err);
  }
}

checkEvolutionWebhook();
