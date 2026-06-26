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
      regex: /ignore\s+(?:all\s+above|previous\s+)?instructions/i,
      reason: 'Malicious intent: Attempt to bypass instructions.',
    },
    {
      regex: /ignore\s+all\s+above/i,
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
      regex: /override\s+(?:your\s+|all\s+)?(?:instructions|rules)/i,
      reason: 'Malicious intent: Attempt to override instructions.',
    },
    {
      regex: /(?:pretend\s+(?:you\s+are\s+the|to\s+be)|act\s+as)\s+system/i,
      reason: 'Malicious intent: Impersonation attempt.',
    },
    {
      regex: /(?:hidden|internal)\s+(?:prompt|rules|instructions)/i,
      reason: 'Malicious intent: System prompt extraction.',
    },
    {
      regex: /print\s+(?:your\s+)?instructions/i,
      reason: 'Malicious intent: System prompt extraction.',
    },
    {
      regex: /\b(?:api\s+key|jwt\s+secret|database\s+password|environment\s+variables|access\s+token|bearer\s+token|env\s+file|dotenv|environment\s+configuration)\b|\.env\b/i,
      reason: 'Malicious intent: Sensitive key extraction.',
    },
    {
      regex: /(?:disable|bypass|skip|ignore)\s+(?:validation|security|filters|authorization|safety|restrictions)/i,
      reason: 'Malicious intent: Validation bypass attempt.',
    },
    {
      regex: /\b(?:bash|sh|powershell|cmd\.exe|terminal|shell|sudo|curl|wget)\b/i,
      reason: 'Malicious intent: Shell execution command injection.',
    },
    {
      regex: /rm\s+-rf/i,
      reason: 'Malicious intent: Shell execution command injection.',
    }
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
