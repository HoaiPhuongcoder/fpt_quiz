export interface ParsedQuestion { n: number; q: string; o: [string, string][]; a: string[]; w?: string }
export function parseQuizMd(text: string): ParsedQuestion[];
