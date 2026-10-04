import { useMemo } from 'react';
import { useApp } from './appStore';
import { computeCounts, poolFor, type Counts } from '../domain/queue';
import type { Question } from '../domain/types';

export function usePool(): Question[] {
  const questions = useApp((s) => s.questions);
  const chs = useApp((s) => s.cfg.chs);
  return useMemo(() => poolFor(questions, chs), [questions, chs]);
}

export function useCounts(): Counts {
  const pool = usePool();
  const cards = useApp((s) => s.cards);
  const now = useApp((s) => s.now);
  const newPerDay = useApp((s) => s.cfg.newPerDay);
  const newSeen = useApp((s) => s.day.newSeen);
  return useMemo(() => computeCounts(pool, cards, now, newPerDay, newSeen), [pool, cards, now, newPerDay, newSeen]);
}
