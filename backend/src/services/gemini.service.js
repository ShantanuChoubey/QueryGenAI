import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance = null;

/**
 * Lazily initialize and return the global GoogleGenerativeAI client instance.
 */
function getGenAIClient() {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

/**
 * Robust JSON extraction tool that strips markdown code fences and cleans up output.
 */
function extractJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('empty response');
  }

  const trimmed = rawText.trim();
  
  // Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    // Strip markdown code fences (e.g. ```json ... ``` or ``` ... ```)
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch (innerErr) {
        throw new Error(`Could not extract JSON: ${innerErr.message}`);
      }
    }

    // Try extracting anything between the first { or [ and last } or ]
    const jsonBoundsMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonBoundsMatch) {
      try {
        return JSON.parse(jsonBoundsMatch[1]);
      } catch (innerErr) {
        throw new Error(`Could not extract JSON: ${innerErr.message}`);
      }
    }

    throw new Error('Could not extract JSON');
  }
}

/**
 * Maps Gemini error cases to standardized HTTP error responses.
 */
function mapGeminiError(error) {
  const message = error.message || '';
  let status = 502; // Default to Bad Gateway for external model issues
  let userMessage = 'AI model generation failed.';

  if (
    message.includes('API_KEY_INVALID') ||
    message.includes('API key not valid') ||
    message.includes('key is invalid')
  ) {
    status = 401;
    userMessage = 'Invalid Gemini API key provided.';
  } else if (
    message.includes('quota') ||
    message.includes('ResourceExhausted') ||
    message.includes('429') ||
    message.includes('Quota exceeded')
  ) {
    status = 429;
    userMessage = 'Gemini API quota exceeded or rate limit hit. Please try again later.';
  } else if (
    message.includes('timeout') ||
    message.includes('DEADLINE_EXCEEDED') ||
    message.includes('ETIMEDOUT')
  ) {
    status = 504;
    userMessage = 'Request to Google Gemini timed out. Please try again.';
  } else if (
    message.includes('unavailable') ||
    message.includes('503') ||
    message.includes('SERVICE_UNAVAILABLE')
  ) {
    status = 503;
    userMessage = 'Google Gemini service is temporarily unavailable. Please try again.';
  } else if (
    message.includes('Could not extract JSON') ||
    message.includes('Unexpected token')
  ) {
    status = 502;
    userMessage = 'Failed to parse optimized SQL queries from Google Gemini.';
  } else if (message.includes('empty response')) {
    status = 502;
    userMessage = 'Received an empty response from the AI provider.';
  } else {
    userMessage = `AI provider error: ${message}`;
  }

  const err = new Error(userMessage);
  err.status = status;
  return err;
}

/**
 * Call the Google Gemini API with validation, parsing, error mapping, and logging.
 */
export async function callGemini(prompt) {
  const startTime = Date.now();
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  console.log(`[Gemini]
Model: ${modelName}
Request started`);

  try {
    const genAI = getGenAIClient();
    
    // Get generative model instance
    const model = genAI.getGenerativeModel({ model: modelName });

    // Enforce structured outputs directive in system instructions
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
      },
    });

    const response = await result.response;
    const rawText = response.text();
    const duration = Date.now() - startTime;

    console.log(`[Gemini]
Model: ${modelName}
Response received
Duration: ${duration}ms`);

    // Log token counts if supported by the metadata response
    const usage = response.usageMetadata;
    if (usage) {
      console.log(`[Gemini] Tokens Used -> Prompt: ${usage.promptTokenCount}, Candidates: ${usage.candidatesTokenCount}, Total: ${usage.totalTokenCount}`);
    }

    const parsedData = extractJson(rawText);
    return parsedData;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Gemini]
Model: ${modelName}
Duration: ${duration}ms
Errors: ${error.message}`);

    throw mapGeminiError(error);
  }
}
