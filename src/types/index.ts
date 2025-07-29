export type MediaType = 'movie' | 'tv';

export type WatchStatus = 'watching' | 'plan-to-watch' | 'finished';

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  status: WatchStatus;
  rating?: number; // 1-10
  genres: string[];
  year?: number;
  poster?: string;
  dateAdded: string;
  dateFinished?: string;
  notes?: string;
}

export interface UserStats {
  totalWatched: number;
  totalWatching: number;
  totalPlanned: number;
  averageRating: number;
}