import { es, type Messages } from './es';
import { en } from './en';

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type Lang = 'es' | 'en';

const STORAGE_KEY = 'doradofundev.lang';

const dicts: Record<Lang, Messages> = {
  es,
  en: en as Messages,
};

let current: Lang = loadLang();
const listeners = new Set<() => void>();

function loadLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'en' ? 'en' : 'es';
}

function resolve(lang: Lang, key: string): string | undefined {
  let node: unknown = dicts[lang];
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function t(key: string): string {
  return resolve(current, key) ?? resolve('es', key) ?? key;
}

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  listeners.forEach((fn) => fn());
}

export function onLangChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
