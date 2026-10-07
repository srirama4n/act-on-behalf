import type { LangPref } from '@/contracts/chatService';
import { en } from './en';
import { es } from './es';

export type Copy = { [K in keyof typeof es]: string };

const catalogs: Record<LangPref, Copy> = { es, en };

export function t(lang: LangPref): Copy {
  return catalogs[lang];
}
