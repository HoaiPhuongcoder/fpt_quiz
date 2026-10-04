import raw from './hcm202.json';
import type { Question } from '../domain/types';

export const QUESTIONS = raw as unknown as Question[];
export const BY_ID: Record<number, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.n, q]));
