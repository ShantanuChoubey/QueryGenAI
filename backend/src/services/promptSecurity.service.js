/**
 * Verify if the user query contains any signatures of prompt injection attempts.
 * Returns safety evaluations and reasons if blocked.
 */
export function checkPromptSafety(query) {
  if (!query || typeof query !== 'string') {
    return {
      isSafe: false,
      reason: 'Query is empty or invalid',
      sanitizedQuery: '',
    };
  }

  const trimmedQuery = query.trim();

  // Rules mapping common injection attack patterns
  const injectionPatterns = [
    {
      regex: /ignore\s+(?:previous\s+)?instructions/i,
      reason: 'Malicious intent: Attempt to bypass instructions.',
    },
    {
      regex: /ignore\s+above/i,
      reason: 'Malicious intent: Attempt to bypass instructions.',
    },
    {
      regex: /reveal\s+(?:system\s+)?prompt/i,
      reason: 'Malicious intent: System prompt extraction.',
    },
    {
      regex: /show\s+(?:system\s+)?prompt/i,
      reason: 'Malicious intent: System prompt extraction.',
    },
    {
      regex: /forget\s+(?:your\s+)?(?:rules|instructions)/i,
      reason: 'Malicious intent: Attempt to override instructions.',
    },
    {
      regex: /show\s+hidden\s+prompt/i,
      reason: 'Malicious intent: System prompt extraction.',
    },
    {
      regex: /(?:execute|run|exec)\s+(?:shell|terminal|system)\s+command/i,
      reason: 'Malicious intent: Shell execution command injection.',
    },
    {
      regex: /(?:return|reveal|show|display)\s+(?:api\s+key|secrets|credentials)/i,
      reason: 'Malicious intent: Sensitive key extraction.',
    },
    {
      regex: /bypass\s+validation/i,
      reason: 'Malicious intent: Validation bypass attempt.',
    },
    {
      regex: /(?:pretend\s+to\s+be|act\s+as)\s+system/i,
      reason: 'Malicious intent: Impersonation attempt.',
    },
    {
      regex: /override\s+(?:instructions|rules)/i,
      reason: 'Malicious intent: Attempt to override instructions.',
    },
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.regex.test(trimmedQuery)) {
      return {
        isSafe: false,
        reason: pattern.reason,
        sanitizedQuery: trimmedQuery,
      };
    }
  }

  return {
    isSafe: true,
    reason: null,
    sanitizedQuery: trimmedQuery,
  };
}
