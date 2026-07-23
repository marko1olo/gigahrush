export const log = {
  info: (...args: any[]) => {
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error(...args);
    }
  },
};
