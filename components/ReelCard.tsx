import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Music2,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { Post } from '../types/Post';

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
  likeRed: '#FF3B5C',
  progressBg: 'rgba(255,255,255,0.30)',
  progressFill: '#FFFFFF',
};

const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

function formatCount(n: number | null | undefined): string {
  if (n == null) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ProgressBar({ progress }: { progress: number }) {
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
      <Heart size={96} color={Colors.likeRed} fill={Colors.likeRed} />
    </Animated.View>
  );
}

function PauseIndicator({ paused }: { paused: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Only flash the indicator when user explicitly pauses
    if (paused) {
      clearTimeout(hideTimer.current);
      opacity.setValue(1);
      scale.setValue(0.7);
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 200,
      }).start();
      // Auto-hide after 800ms
      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 800);
    } else {
      clearTimeout(hideTimer.current);
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    return () => clearTimeout(hideTimer.current);
  }, [paused]);

  return (
    <Animated.View
      style={[styles.pauseOverlay, { opacity }]}
      pointerEvents="none"
    >
      <View style={styles.pauseIconBg}>
        {/* Two vertical bars = pause icon, no extra library needed */}
        <View style={styles.pauseBars}>
          <View style={styles.pauseBar} />
          <View style={styles.pauseBar} />
        </View>
      </View>
    </Animated.View>
  );
}

interface ReelCardProps {
  reel: Post;
  isActive: boolean;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
  onFollow?: (id: string) => void;
  onUserPress?: (username: string) => void;
}
export const ReelCard: React.FC<ReelCardProps> = memo(
  ({ reel, isActive, onLike, onComment, onShare, onUserPress }) => {
    const insets = useSafeAreaInsets();

    //  Playback
    const [paused, setPaused] = useState(false);
    const [muted, setMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffering, setBuffering] = useState(false);

    //  Like
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(reel.likesCount ?? 0);
    const [showHeart, setShowHeart] = useState(false);
    const heartTimeout = useRef<ReturnType<typeof setTimeout>>();

    //  Tap handling
    const lastTap = useRef<number>(0);
    const singleTapTimer = useRef<ReturnType<typeof setTimeout>>();

    const navigator = useNavigation();
    navigator.addListener('blur', () => {
      setPaused(true);
    });
    navigator.addListener('focus', () => {
      if (isActive) {
        setPaused(false);
      }
    });

    //  Sync isActive → paused
    useEffect(() => {
      if (isActive) {
        setPaused(false);
      } else {
        setPaused(true);
        setCurrentTime(0);
      }
    }, [isActive]);

    //  Video callbacks
    const handleLoad = useCallback((data: OnLoadData) => {
      setDuration(data.duration);
    }, []);

    const handleProgress = useCallback((data: OnProgressData) => {
      setCurrentTime(data.currentTime);
    }, []);

    //  Like
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

    //  Tap: single = pause/resume, double = like
    const handleTap = useCallback(() => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 280;

      if (now - lastTap.current < DOUBLE_TAP_DELAY) {
        // Double tap detected — cancel pending single-tap
        clearTimeout(singleTapTimer.current);
        triggerDoubleTapLike();
      } else {
        // Wait to see if a second tap follows
        singleTapTimer.current = setTimeout(() => {
          setPaused(p => !p);
        }, DOUBLE_TAP_DELAY);
      }
      lastTap.current = now;
    }, [triggerDoubleTapLike]);

    const progress = duration > 0 ? currentTime / duration : 0;

    return (
      <View style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />

        <Video
          source={{ uri: reel.media[0].url }}
          poster={{
            source: { uri: reel.media[0].thumbnailUrl },
            resizeMode: 'contain',
          }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          paused={paused}
          muted={muted}
          repeat={false}
          controls={false}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
          ignoreSilentSwitch="ignore"
          playInBackground={false}
          playWhenInactive={false}
        />

        {/*  Tap overlay (sits above video, below action rail)  */}
        <Pressable
          onPress={handleTap}
          style={styles.tapOverlay}
          accessible={false}
        />

        {/*  Pause flash indicator  */}
        <PauseIndicator paused={paused} />

        {/*  Buffering spinner  */}
        {buffering && !paused && (
          <View style={styles.bufferOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={Colors.white} />
          </View>
        )}

        {/*  Double-tap heart burst  */}
        <HeartBurst visible={showHeart} />

        {/*  Right action rail  */}
        <View
          style={[
            styles.actionRail,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
        >
          {/* Like */}
          <Pressable
            onPress={triggerLike}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`${
              liked ? 'Unlike' : 'Like'
            } reel, ${formatCount(likesCount)} likes`}
            style={styles.actionButton}
          >
            <Heart
              size={28}
              color={liked ? Colors.likeRed : Colors.white}
              fill={liked ? Colors.likeRed : 'transparent'}
            />
            <Text style={styles.actionLabel}>{formatCount(likesCount)}</Text>
          </Pressable>

          {/* Comment */}
          <Pressable
            onPress={() => onComment?.(reel.id)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`${formatCount(reel.commentsCount)} comments`}
            style={styles.actionButton}
          >
            <MessageCircle size={28} color={Colors.white} />
            <Text style={styles.actionLabel}>
              {formatCount(reel.commentsCount)}
            </Text>
          </Pressable>

          {/* Share */}
          <Pressable
            onPress={() => onShare?.(reel.id)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Share reel, ${formatCount(
              reel.sharesCount,
            )} shares`}
            style={styles.actionButton}
          >
            <Share2 size={28} color={Colors.white} />
            <Text style={styles.actionLabel}>
              {formatCount(reel.sharesCount)}
            </Text>
          </Pressable>

          {/* Mute */}
          <Pressable
            onPress={() => setMuted(m => !m)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={muted ? 'Unmute video' : 'Mute video'}
            style={styles.actionButton}
          >
            {muted ? (
              <VolumeX size={26} color={Colors.white} />
            ) : (
              <Volume2 size={26} color={Colors.white} />
            )}
          </Pressable>
        </View>

        {/*  Bottom info + progress  */}
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
              @{reel.username}
            </Text>
          </Pressable>

          {/* Caption */}
          {!!reel.caption && (
            <Text style={styles.caption} numberOfLines={2}>
              {reel.caption}
            </Text>
          )}

          {/* Audio name */}
          {reel.audio && (
            <View style={styles.audioRow}>
              <Music2 size={12} color={Colors.white80} />
              <Text style={styles.audioText} numberOfLines={1}>
                {reel.audio.title} · {reel.audio.artist}
              </Text>
            </View>
          )}

          {/* Progress bar */}
          <ProgressBar progress={progress} />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: Colors.black,
    overflow: 'hidden',
  },

  // Tap overlay — sits above video, below action buttons
  tapOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },

  // Pause indicator
  pauseOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
  pauseBars: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBar: {
    width: 5,
    height: 22,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },

  // Buffer
  bufferOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },

  // Heart burst
  heartBurst: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },

  // Right action rail
  actionRail: {
    position: 'absolute',
    right: Spacing.md,
    bottom: 50,
    alignItems: 'center',
    gap: Spacing.md,
    zIndex: 50,
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
    marginTop: 3,
    textShadowColor: Colors.black50,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
    zIndex: 50,
  },

  // User row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontSize: 15,
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

  // Audio row
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
    width: '100%',
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
