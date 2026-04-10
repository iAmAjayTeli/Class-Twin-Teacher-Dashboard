/**
 * LocalStorage Cache with TTL (Time-To-Live)
 *
 * Provides instant cached data when navigating between pages,
 * while silently refreshing stale data in the background.
 *
 * Usage:
 *   import { cacheGet, cacheSet, cacheClear, CACHE_KEYS } from '../lib/cache';
 *
 *   // Check cache first
 *   const cached = cacheGet(CACHE_KEYS.STUDENTS);
 *   if (cached) setStudents(cached);
 *
 *   // After fetching fresh data
 *   cacheSet(CACHE_KEYS.STUDENTS, freshData, 5 * 60 * 1000); // 5 min TTL
 */

// ─── Default TTLs (milliseconds) ──────────────────────────────
export const TTL = {
  SHORT: 2 * 60 * 1000,   //  2 minutes  – rapidly changing (live sessions)
  MEDIUM: 5 * 60 * 1000,  //  5 minutes  – default for most pages
  LONG: 15 * 60 * 1000,   // 15 minutes  – rarely changing (materials, settings)
  HOUR: 60 * 60 * 1000,   //  1 hour     – static data
};

// ─── Cache Keys ───────────────────────────────────────────────
export const CACHE_KEYS = {
  DASHBOARD_STATS: 'ct_cache_dashboard_stats',
  DASHBOARD_ORACLE: 'ct_cache_dashboard_oracle',
  ALL_SESSIONS: 'ct_cache_all_sessions',
  STUDENTS: 'ct_cache_students',
  STUDENT_DETAIL: (name) => `ct_cache_student_${name}`,
  ANALYTICS_STATS: 'ct_cache_analytics_stats',
  MATERIALS: 'ct_cache_materials',
  AI_PREDICTION: (name) => `ct_cache_prediction_${name}`,
};

// ─── Core Methods ─────────────────────────────────────────────

/**
 * Get cached data if it exists and hasn't expired.
 * @param {string} key - Cache key
 * @returns {any|null} Parsed data or null if expired/missing
 */
export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Store data in cache with a TTL.
 * @param {string} key  - Cache key
 * @param {any}    data - Data to cache (must be JSON-serializable)
 * @param {number} ttl  - Time-to-live in milliseconds (default: 5 min)
 */
export function cacheSet(key, data, ttl = TTL.MEDIUM) {
  try {
    const entry = {
      data,
      expiresAt: Date.now() + ttl,
      cachedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    // localStorage full — clear old cache entries and retry once
    if (e.name === 'QuotaExceededError') {
      cacheClearAll();
      try {
        localStorage.setItem(key, JSON.stringify({
          data,
          expiresAt: Date.now() + ttl,
          cachedAt: Date.now(),
        }));
      } catch {
        // silently fail
      }
    }
  }
}

/**
 * Remove a single cache entry.
 * @param {string} key - Cache key
 */
export function cacheClear(key) {
  localStorage.removeItem(key);
}

/**
 * Clear all ClassTwin cache entries.
 */
export function cacheClearAll() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('ct_cache_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

/**
 * Check how old the cached data is (in seconds).
 * Returns null if no cache exists.
 * @param {string} key - Cache key
 * @returns {number|null} Age in seconds, or null
 */
export function cacheAge(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { cachedAt } = JSON.parse(raw);
    return Math.round((Date.now() - cachedAt) / 1000);
  } catch {
    return null;
  }
}

/**
 * Check if cache exists (even if expired).
 * Useful for stale-while-revalidate patterns.
 * @param {string} key - Cache key
 * @returns {{ data: any, isStale: boolean } | null}
 */
export function cacheGetWithStaleInfo(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const { data, expiresAt } = JSON.parse(raw);
    return {
      data,
      isStale: Date.now() > expiresAt,
    };
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}
