import React, { useCallback, useEffect } from 'react';
import { View, ActivityIndicator, FlatList, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useHomePageFeed } from '../hooks/useHomePageFeed';

import { PostCard } from '../components/PostCard';

import { Post } from '../types/Post';

export function HomePage() {
  const [loading, setLoading] = React.useState(false);
  const { posts, loadMore, hasMore } = useHomePageFeed();

  useEffect(() => {
    async function fetchInitialPosts() {
      setLoading(true);
      await loadMore();
      setLoading(false);
    }
    fetchInitialPosts();
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => <PostCard key={item.id} {...item} />,
    [],
  );
  const keyExtractor = useCallback((item: Post) => item.id, []);

  return (
    <SafeAreaProvider>
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator color={'black'} size={'large'} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          style={{ paddingVertical: 50 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={5}
        />
      )}
    </SafeAreaProvider>
  );
}
