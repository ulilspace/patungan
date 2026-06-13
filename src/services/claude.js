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
          { type: 'text', text: `You are a bill parser. Extract all information from this receipt image.\nReturn ONLY a JSON object with NO markdown or preamble:\n{\n  "restaurantName": "string or null",\n  "suggestedTitle": "string",\n  "items": [{ "name": "string", "qty": number, "unitPrice": number }],\n  "subtotal": number,\n  "tax": number,\n  "serviceCharge": number,\n  "grandTotal": number\n}\nAll prices as plain integers. No symbols or commas.` }
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
