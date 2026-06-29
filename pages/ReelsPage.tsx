import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useReelPageFeed } from '../hooks/useReelPageFeed';

import { ReelCard } from '../components/ReelCard';

import { Post } from '../types/Post';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

export function ReelsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { reels, loadMore, hasMore, loading } = useReelPageFeed();

  useEffect(() => {
    loadMore();
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: SCREEN_H,
      offset: SCREEN_H * index,
      index,
    }),
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <ReelCard
        reel={item}
        isActive={index === activeIndex}
        onLike={id => console.log('liked', id)}
        onComment={id => console.log('comment', id)}
        onShare={id => console.log('share', id)}
        onFollow={id => console.log('follow', id)}
        onUserPress={username => console.log('profile', username)}
      />
    ),
    [activeIndex],
  );

  const keyExtractor = useCallback((item: Post): string => item.id, []);

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <FlatList
          data={reels}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.98}
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          removeClippedSubviews
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={1}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
});
