/**
 * Service connector to interface with the Llama API.
 */
export async function callLlama(prompt) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error('LLM_API_KEY is not defined in environment variables');
  }

  // Standard Llama API chat completion endpoint
  const endpoint = 'https://api.llama-api.com/chat/completions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama3.1-70b', // standard Llama API model reference
      messages: [
        {
          role: 'system',
          content: 'You are an AI database expert that generates structured PostgreSQL queries alternatives. You must respond strictly in valid JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Llama API call failed with status ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response received from Llama API');
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error('Llama API returned invalid JSON output: ' + content);
  }
}
