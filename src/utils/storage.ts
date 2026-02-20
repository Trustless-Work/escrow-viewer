export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    const storage = window.localStorage;
    if (!storage || typeof storage.getItem !== "function") return null;
    try {
      return storage.getItem(key);
    } catch (e) {
      console.warn("Error accessing localStorage:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    const storage = window.localStorage;
    if (!storage || typeof storage.setItem !== "function") return;
    try {
      storage.setItem(key, value);
    } catch (e) {
      console.warn("Error setting localStorage:", e);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    const storage = window.localStorage;
    if (!storage || typeof storage.removeItem !== "function") return;
    try {
      storage.removeItem(key);
    } catch (e) {
      console.warn("Error removing from localStorage:", e);
    }
  },
};
