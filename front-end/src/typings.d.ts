declare module 'voyager' {
    export function createVoyager(): any;
    export interface Voyager {
      insert(document: { id: number; text?: string; vector?: number[] }): void;
      search(query: string | number[], topN?: number): { id: number; score: number }[];
    }
}