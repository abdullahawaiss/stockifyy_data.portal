type RateLimitStore = Map<string, { count: number; resetAt: number }>;

function makeRateLimiter(windowMs: number, maxAttempts: number) {
  const store: RateLimitStore = new Map();
  return function check(key: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true };
    }
    entry.count += 1;
    if (entry.count > maxAttempts) {
      return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }
    return { allowed: true };
  };
}

// Login: 5 attempts per 15 minutes per IP
export const checkRateLimit = makeRateLimiter(15 * 60 * 1000, 5);

// Signup: 3 attempts per 60 minutes per IP (stricter — account creation is heavier)
export const checkSignupRateLimit = makeRateLimiter(60 * 60 * 1000, 3);
