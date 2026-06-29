import { useState, useCallback } from 'react';

import { getFeed } from '../utils/DBoperations';

import { Post } from '../types/Post';

export const useHomePageFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (!hasMore) return;

    try {
      const result = await getFeed(lastDoc);

      setPosts(prev => [...prev, ...result.posts]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
  }, [lastDoc, hasMore]);

  return { posts, loadMore, hasMore };
};
