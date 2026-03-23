export interface RankingConfig {
  minLag: number;
  excludeGlobs: string[];
  includeExact: string[];
}

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  minLag: 0,
  excludeGlobs: [],
  includeExact: [],
};
