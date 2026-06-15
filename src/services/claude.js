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
          { type: 'text', text: `You are a bill parser. Extract all information from this receipt image and analyze the tax/service formula carefully.\nReturn ONLY a JSON object with NO markdown or preamble:\n{\n  "restaurantName": "string or null",\n  "suggestedTitle": "string",\n  "items": [{ "name": "string", "qty": number, "unitPrice": number }],\n  "subtotal": number,\n  "tax": number,\n  "taxRate": number,\n  "taxBase": number,\n  "serviceCharge": number,\n  "serviceRate": number,\n  "serviceBase": number,\n  "discount": number,\n  "discountLabel": "string or null",\n  "grandTotal": number\n}\nInstructions:\n1. Find tax label (PB1, VAT, PPN, Tax) and its amount and rate (e.g. "PB1 10%" means taxRate=10).\n2. Find service charge label and its amount and rate (e.g. "Service 5%" means serviceRate=5).\n3. Derive taxBase = tax / (taxRate/100). This is the DPP — may differ from subtotal if some items are excluded.\n4. Derive serviceBase = serviceCharge / (serviceRate/100).\n5. If no percentage shown, set rate to 0 and base equals the amount itself.\n6. Find any discount, promo, or voucher line (e.g. "Menu Discount", "BCA Promo", "Diskon"). Set discount as a positive number (the amount being subtracted) and discountLabel as its description. If none, discount=0.\nAll prices as plain integers (no symbols, no commas, round to nearest integer).` }
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
