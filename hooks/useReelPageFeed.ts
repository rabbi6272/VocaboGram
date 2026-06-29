import { useState, useCallback } from 'react';

import { getReels } from '../utils/DBoperations';

import { Post } from '../types/Post';

export const useReelPageFeed = () => {
  const [reels, setReels] = useState<Post[]>([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const result = await getReels(lastDoc);

      setReels(prev => [...prev, ...result.reels]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } finally {
      setLoading(false);
    }
  }, [lastDoc, hasMore, loading]);

  return { reels, loadMore, hasMore, loading };
};
