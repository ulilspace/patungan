export async function parseBillImage(base64Image, mimeType) {
  const token = localStorage.getItem('claudeApiToken');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': token,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Image } },
          { type: 'text', text: `You are a bill parser. Extract all information from this receipt image.\nReturn ONLY a JSON object with NO markdown or preamble:\n{\n  "restaurantName": "string or null",\n  "suggestedTitle": "string",\n  "items": [{ "name": "string", "qty": number, "unitPrice": number }],\n  "subtotal": number,\n  "tax": number,\n  "taxType": "percent" or "flat",\n  "taxRate": number,\n  "serviceCharge": number,\n  "serviceType": "percent" or "flat",\n  "serviceRate": number,\n  "grandTotal": number\n}\nFor taxType/serviceType: use "percent" if the receipt shows a percentage (e.g. "PB1 10%" or "Service 5%"), use "flat" if it is a fixed amount with no percentage shown.\nFor taxRate/serviceRate: if percent, put the percentage number (e.g. 10 for 10%); if flat, put the same amount as tax/serviceCharge.\nAll prices as plain integers. No symbols or commas.` }
        ]
      }]
    })
  });
  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text || '';
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

export function expandItems(parsedItems) {
  const expanded = [];
  parsedItems.forEach(item => {
    if (item.qty <= 1) {
      expanded.push({ name: item.name, price: item.unitPrice, originalName: item.name });
    } else {
      for (let i = 1; i <= item.qty; i++) {
        expanded.push({ name: `${item.name} #${i}`, price: item.unitPrice, originalName: item.name });
      }
    }
  });
  return expanded;
}
