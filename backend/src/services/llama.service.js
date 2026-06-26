const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Service connector to interface with the Llama API with timeouts and retries.
 */
export async function callLlama(prompt) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error('LLM_API_KEY is not defined in environment variables');
  }

  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  const maxRetries = 2;
  const backoffDelays = [500, 1000];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout limit

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.APP_URL || 'http://localhost',
          'X-Title': process.env.APP_NAME || 'QueryGenAI',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
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

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        const status = response.status;

        // Check if error status is transient and eligible for retries
        const isTransient = [429, 502, 503, 504].includes(status);
        if (isTransient && attempt < maxRetries) {
          const waitTime = backoffDelays[attempt];
          console.warn(`Llama API transient status ${status}. Retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})...`);
          await delay(waitTime);
          continue;
        }

        throw new Error(`Llama API call failed with status ${status}: ${errorBody}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response received from Llama API');
      }

      return JSON.parse(content);
    } catch (error) {
      clearTimeout(timeoutId);

      // Check if error was caused by fetch abortion (timeout)
      const isTimeout = error.name === 'AbortError';

      if (isTimeout) {
        if (attempt < maxRetries) {
          const waitTime = backoffDelays[attempt];
          console.warn(`Llama API request timed out. Retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})...`);
          await delay(waitTime);
          continue;
        }
        const timeoutError = new Error('Llama API request timed out after 30 seconds');
        timeoutError.status = 504; // Gateway Timeout
        throw timeoutError;
      }

      // If it is a transient connection error, retry
      const isConnectionError = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message?.includes('fetch');
      if (isConnectionError && attempt < maxRetries) {
        const waitTime = backoffDelays[attempt];
        console.warn(`Llama API network error (${error.message}). Retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await delay(waitTime);
        continue;
      }

      throw error;
    }
  }
}
