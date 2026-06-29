import React, { useCallback, useEffect } from 'react';
import { View, Text, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useHomePageFeed } from '../hooks/useHomePageFeed';

import { PostCard } from '../components/PostCard';

import { Post } from '../types/Post';

export function HomePage() {
  const { posts, loadMore, hasMore } = useHomePageFeed();

  useEffect(() => {
    loadMore();
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => <PostCard key={item.id} {...item} />,
    [],
  );
  const keyExtractor = useCallback((item: Post) => item.id, []);

  return (
    <SafeAreaProvider>
      {/* {loading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator color={'black'} size={'large'} />
        </View>
      ) : posts.length > 0 ? ( */}
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
      {/* ) : (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600' }}>
            No post available!!!
          </Text>
        </View>
      )} */}
    </SafeAreaProvider>
  );
}
