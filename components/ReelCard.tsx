import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Post } from '../types/Post';

import { Heart, MessageCircle, PauseCircle, Share2 } from 'lucide-react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const Colors = {
  white: '#FFFFFF',
  white80: 'rgba(255,255,255,0.80)',
  white60: 'rgba(255,255,255,0.60)',
  white20: 'rgba(255,255,255,0.20)',
  white10: 'rgba(255,255,255,0.10)',
  black: '#000000',
  black80: 'rgba(0,0,0,0.80)',
  black50: 'rgba(0,0,0,0.50)',
  black20: 'rgba(0,0,0,0.20)',
  indigo: '#6366F1',
  indigoDark: '#4F46E5',
  likeRed: '#FF3B5C',
  progressBg: 'rgba(255,255,255,0.30)',
  progressFill: '#FFFFFF',
};

const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

interface ReelCardProps {
  reel: Post;
  isActive: boolean;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
  onFollow?: (id: string) => void;
  onUserPress?: (username: string) => void;
}

function formatCount(n: number | undefined): string {
  if (n === undefined) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function useDoubleTap(onDoubleTap: () => void, delay = 300) {
  const lastTap = useRef<number>(0);
  return useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < delay) {
      onDoubleTap();
    }
    lastTap.current = now;
  }, [onDoubleTap, delay]);
}

interface ProgressBarProps {
  progress: number; // 0–1
  duration: number; // seconds
  currentTime: number;
}

function ProgressBar({ progress, duration, currentTime }: ProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        {/* Scrubber knob */}
        <Animated.View
          style={[
            styles.progressKnob,
            {
              left: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      {/* <View style={styles.progressTimes}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View> */}
    </View>
  );
}

function HeartBurst({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(1);
      scale.setValue(0.4);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.4,
          useNativeDriver: true,
          damping: 6,
          stiffness: 180,
        }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.heartBurst, { opacity, transform: [{ scale }] }]}
      pointerEvents="none"
    >
      <Heart size={96} color={Colors.likeRed} />
    </Animated.View>
  );
}

export function ReelCard({
  reel,
  isActive,
  onLike,
  onComment,
  onShare,
  onFollow,
  onUserPress,
}: ReelCardProps) {
  const insets = useSafeAreaInsets();

  // Playback state
  const [paused, setPaused] = useState(!isActive);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Like state
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likesCount);
  const [showHeart, setShowHeart] = useState(false);
  const heartTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Pause overlay
  const pauseOpacity = useRef(new Animated.Value(0)).current;

  // Sync isActive → paused
  useEffect(() => {
    setPaused(!isActive);
    if (!isActive) {
      setCurrentTime(0);
    }
  }, [isActive]);

  // Pause/resume feedback overlay
  useEffect(() => {
    if (paused) {
      Animated.timing(pauseOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(pauseOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [paused]);

  const handleLoad = useCallback((data: OnLoadData) => {
    setDuration(data.duration);
    setVideoReady(true);
  }, []);

  const handleProgress = useCallback((data: OnProgressData) => {
    setCurrentTime(data.currentTime);
  }, []);

  const handleEnd = useCallback(() => {
    // Loop: seeking back to 0 is handled by `repeat` prop on Video
  }, []);

  const togglePlay = useCallback(() => {
    setPaused(p => !p);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(m => !m);
  }, []);

  const triggerLike = useCallback(() => {
    setLiked(prev => {
      setLikesCount(c => (prev ? c - 1 : c + 1));
      return !prev;
    });
    onLike?.(reel.id);
  }, [reel.id, onLike]);

  const triggerDoubleTapLike = useCallback(() => {
    if (!liked) {
      setLiked(true);
      setLikesCount(c => c + 1);
      onLike?.(reel.id);
    }
    clearTimeout(heartTimeout.current);
    setShowHeart(true);
    heartTimeout.current = setTimeout(() => setShowHeart(false), 900);
  }, [liked, reel.id, onLike]);

  const handleDoubleTap = useDoubleTap(triggerDoubleTapLike);

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* ── Video ── */}
      <TouchableWithoutFeedback
        onPress={() => {
          handleDoubleTap();
          togglePlay();
        }}
      >
        <View style={StyleSheet.absoluteFill}>
          {reel.media[0].thumbnailUrl && !videoReady && (
            <Image
              source={{ uri: reel.media[0].thumbnailUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          )}
          <Video
            source={{ uri: reel.media[0].url }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            paused={paused}
            muted={muted}
            repeat
            onLoad={handleLoad}
            onProgress={handleProgress}
            onEnd={handleEnd}
            onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
            ignoreSilentSwitch="ignore"
            playInBackground={false}
            playWhenInactive={false}
          />
        </View>
      </TouchableWithoutFeedback>

      {/* ── Pause overlay icon ── */}
      <Animated.View
        style={[styles.pauseOverlay, { opacity: pauseOpacity }]}
        pointerEvents="none"
      >
        <View style={styles.pauseIconBg}>
          <PauseCircle size={48} color={Colors.white} />
        </View>
      </Animated.View>

      {/* ── Buffering spinner ── */}
      {buffering && !paused && (
        <View style={styles.bufferOverlay} pointerEvents="none">
          <ActivityIndicator size={'large'} color={Colors.white} />
        </View>
      )}

      {/* ── Double-tap heart burst ── */}
      <HeartBurst visible={showHeart} />

      {/* ── Right action rail ── */}
      <View
        style={[
          styles.actionRail,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        {/* Like */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Heart
            size={28}
            color={liked ? Colors.likeRed : Colors.white}
            onPress={triggerLike}
            accessibilityRole="button"
            accessibilityLabel={`${
              liked ? 'Unlike' : 'Like'
            } reel, ${formatCount(likesCount)} likes`}
          />
          <Text style={styles.actionLabel}>{formatCount(likesCount)}</Text>
        </View>

        {/* Comment */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <MessageCircle
            size={28}
            color={Colors.white}
            onPress={() => onComment?.(reel.id)}
            accessibilityRole="button"
            accessibilityLabel={`Comment on reel, ${formatCount(
              reel.commentsCount,
            )} comments`}
          />
          <Text style={styles.actionLabel}>
            {formatCount(reel.commentsCount)}
          </Text>
        </View>

        {/* Share */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Share2
            size={28}
            color={Colors.white}
            onPress={() => onShare?.(reel.id)}
            accessibilityRole="button"
            accessibilityLabel={`Share reel, ${formatCount(
              reel.sharesCount,
            )} shares`}
          />
          <Text style={styles.actionLabel}>
            {formatCount(reel.sharesCount)}
          </Text>
        </View>

        {/* Mute */}

        {/* More */}

        {/* Rotating audio disc */}
        <View style={styles.audioDisc}>
          <View style={styles.audioDiscInner}>
            <Text style={{ color: Colors.white, fontSize: 16 }}>🎵</Text>
          </View>
        </View>
      </View>

      {/* ── Bottom info + progress ── */}
      <View
        style={[
          styles.bottomInfo,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        {/* Username row */}
        <Pressable
          onPress={() => onUserPress?.(reel.username)}
          accessibilityRole="button"
          accessibilityLabel={`View ${reel.username}'s profile`}
          style={styles.userRow}
        >
          {reel.userAvatar ? (
            <Image source={{ uri: reel.userAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>
                {reel.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.username} numberOfLines={1}>
            {reel.username}
          </Text>

          {/* Follow pill */}
          {/* <Pressable
            onPress={() => {
              setFollowing(f => !f);
              onFollow?.(reel.id);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={following ? 'Unfollow user' : 'Follow user'}
            style={[styles.followPill, following && styles.followPillActive]}
          >
            <Text
              style={[styles.followText, following && styles.followTextActive]}
            >
              {following ? 'Following' : 'Follow'}
            </Text>
          </Pressable> */}
        </Pressable>

        {/* Caption */}
        <Text style={styles.caption} numberOfLines={2}>
          {reel.caption}
        </Text>

        {/* Audio name */}
        {reel.audio && (
          <View style={styles.audioRow}>
            <Text style={styles.audioText} numberOfLines={1}>
              {reel.audio.title} - {reel.audio.artist}
            </Text>
          </View>
        )}

        {/* Progress bar */}
        <ProgressBar
          progress={progress}
          duration={duration}
          currentTime={currentTime}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: Colors.black,
    overflow: 'hidden',
  },

  //   // Scrims
  //   scrimBottom: {
  //     ...StyleSheet.absoluteFill,
  //     top: '40%',
  //     backgroundColor: 'transparent',
  //     // We overlay two semi-transparent views for the gradient effect:
  //     borderTopColor: 'transparent',
  //     // Use the two-view trick below:
  //   },
  //   scrimTop: {
  //     position: 'absolute',
  //     top: 0,
  //     left: 0,
  //     right: 0,
  //     height: 120,
  //     backgroundColor: Colors.black20,
  //   },

  // Pause overlay
  pauseOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.black50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white20,
  },

  // Buffer spinner (CSS-only shimmer via border trick)
  bufferOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bufferSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.white20,
    borderTopColor: Colors.white,
  },

  // Heart burst
  heartBurst: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Right action rail
  actionRail: {
    position: 'absolute',
    right: Spacing.md,
    bottom: 50,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionLabel: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: Colors.black50,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Rotating audio disc
  audioDisc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white10,
    borderWidth: 2,
    borderColor: Colors.white20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  audioDiscInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.black50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bottom info
  bottomInfo: {
    position: 'absolute',
    left: 0,
    right: 72,
    bottom: 60,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: 'transparent',
  },

  // User row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  avatarFallback: {
    backgroundColor: Colors.indigo,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  username: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textShadowColor: Colors.black50,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Follow pill
  followPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.white,
    backgroundColor: Colors.white10,
    minWidth: 44,
    alignItems: 'center',
  },
  followPillActive: {
    backgroundColor: Colors.white20,
    borderColor: Colors.white60,
  },
  followText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  followTextActive: {
    color: Colors.white80,
  },

  // Caption
  caption: {
    color: Colors.white,
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '400',
    textShadowColor: Colors.black50,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // Audio
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  audioText: {
    color: Colors.white80,
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
  },

  // Progress bar
  progressContainer: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  progressTrack: {
    height: 2.5,
    backgroundColor: Colors.progressBg,
    borderRadius: 2,
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.progressFill,
    borderRadius: 2,
  },
  progressKnob: {
    position: 'absolute',
    top: -4.75,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
    marginLeft: -6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: Colors.white60,
    fontSize: 11,
    fontWeight: '500',
  },
});
