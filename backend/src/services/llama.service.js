const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Model priority list — tried in order. First that works wins.
// All use the :free tier. Add LLM_MODEL env var to override entirely.
const FREE_MODEL_FALLBACKS = [
  'google/gemma-2-9b-it:free',
  'qwen/qwen3-8b:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
];

/**
 * Attempt to extract a JSON object from a string that may contain markdown code
 * fences or other surrounding text. Some free models ignore response_format.
 */
function extractJson(raw) {
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch (_) {
    // Attempt to strip markdown code fences: ```json ... ``` or ``` ... ```
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) {
      return JSON.parse(fenceMatch[1].trim());
    }
    // Attempt to extract bare object/array
    const objMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (objMatch) {
      return JSON.parse(objMatch[1]);
    }
    throw new Error('Could not extract JSON from model response');
  }
}

/**
 * Call OpenRouter with automatic model fallback and retry logic.
 */
export async function callLlama(prompt) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error('LLM_API_KEY is not defined in environment variables');
  }

  // Allow full override from environment, otherwise use fallback list
  const envModel = process.env.LLM_MODEL?.trim();
  const modelsToTry = envModel ? [envModel, ...FREE_MODEL_FALLBACKS] : FREE_MODEL_FALLBACKS;

  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  const TRANSIENT_STATUSES = [429, 502, 503, 504];
  const MODEL_UNAVAILABLE_STATUSES = [400, 404];

  for (let modelIndex = 0; modelIndex < modelsToTry.length; modelIndex++) {
    const model = modelsToTry[modelIndex];
    const maxRetries = 2;
    const backoffDelays = [800, 1600];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.APP_URL || 'http://localhost',
            'X-Title': process.env.APP_NAME || 'QueryGenAI',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are an AI database expert. Generate structured PostgreSQL query alternatives. Always respond with a raw JSON object — no markdown, no code fences.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            // Some free models don't support response_format — we handle JSON extraction manually
            temperature: 0.3,
          }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const status = response.status;
          const errorBody = await response.text();

          // Model is unavailable / deprecated — skip to next model
          if (MODEL_UNAVAILABLE_STATUSES.includes(status)) {
            console.warn(`[LLM] Model "${model}" returned ${status}. Trying next fallback...`);
            break; // break inner retry loop → next model
          }

          // Transient error — retry same model
          if (TRANSIENT_STATUSES.includes(status) && attempt < maxRetries) {
            console.warn(`[LLM] Transient ${status} on "${model}". Retry ${attempt + 1}/${maxRetries}...`);
            await delay(backoffDelays[attempt]);
            continue;
          }

          // Parse the error for a clean message
          let providerMessage = `AI provider error (${status})`;
          try {
            const parsed = JSON.parse(errorBody);
            providerMessage = parsed?.error?.message || parsed?.message || providerMessage;
          } catch (_) {
            // raw text — keep default
          }

          const err = new Error(providerMessage);
          err.status = status >= 500 ? 502 : status;
          throw err;
        }

        const result = await response.json();
        const rawContent = result.choices?.[0]?.message?.content;

        if (!rawContent) {
          throw new Error('AI provider returned an empty response. Please try again.');
        }

        const parsed = extractJson(rawContent);
        console.info(`[LLM] Success with model "${model}"`);
        return parsed;

      } catch (error) {
        clearTimeout(timeoutId);

        // Timeout
        if (error.name === 'AbortError') {
          if (attempt < maxRetries) {
            console.warn(`[LLM] Timeout on "${model}". Retry ${attempt + 1}/${maxRetries}...`);
            await delay(backoffDelays[attempt]);
            continue;
          }
          // Try next model on final timeout
          console.warn(`[LLM] "${model}" timed out on all attempts. Trying next model...`);
          break;
        }

        // Connection errors — retry
        const isConnectionError =
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          error.message?.includes('fetch failed');
        if (isConnectionError && attempt < maxRetries) {
          console.warn(`[LLM] Connection error on "${model}": ${error.message}. Retry ${attempt + 1}/${maxRetries}...`);
          await delay(backoffDelays[attempt]);
          continue;
        }

        // Re-throw structured errors immediately (no point retrying model errors)
        if (error.status) {
          throw error;
        }

        throw error;
      }
    }
  }

  // All models exhausted
  const err = new Error(
    'All AI models are currently unavailable. Please try again in a few minutes.'
  );
  err.status = 503;
  throw err;
}
