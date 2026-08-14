import type { KeyValueStorage } from '../../src/core/save'

/** In-memory KeyValueStorage for tests - no DOM/localStorage needed. Originally local to
 * save.test.ts, extracted here so settings.test.ts (and anything else exercising a
 * KeyValueStorage-backed module) can reuse it. Not a *.test.ts file, so vitest's default include
 * glob doesn't collect it as a test suite on its own. */
export function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  }
}
