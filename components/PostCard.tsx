import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
  AccessibilityInfo,
  TouchableWithoutFeedback,
} from 'react-native';

import { InfoIcon } from 'lucide-react-native';
import Video from 'react-native-video';

const INDIGO = {
  50: '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  400: '#818cf8',
  500: '#6366f1',
  600: '#4f46e5',
  700: '#4338ca',
};

const Colors = {
  background: '#ECEFF4',
  surface: '#ECEFF4',
  surfaceRaised: '#F8FAFF',
  textPrimary: '#1E2333',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  accent: INDIGO[500],
  accentLight: INDIGO[100],
  danger: '#EF4444',
  divider: '#D1D9E6',
  iconDefault: '#475569',
  shadowDark: '#B8C1D4',
  shadowLight: '#FFFFFF',
};

const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 18,
};

import { Post } from '../types/Post';
interface PostProps {
  onLike?: (postId: string, liked: boolean) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string, saved: boolean) => void;
  onUserPress?: (userId: string) => void;
  onMoreOptions?: (postId: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatCount(n: number | null): string | null {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export const PostCard: React.FC<Post & PostProps> = memo(
  ({
    id,
    caption,
    hashtags = [],
    likesCount,
    commentsCount,
    sharesCount,
    media = [
      { id: '', height: 0, width: 0, url: '', thumbnailUrl: '', type: 'image' },
    ],
    userId,
    username,
    userAvatar,
    mentions = [],
    location,
  }) => {
    const [liked, setLiked] = useState(false);
    const [likeAnim, setLikeAnim] = useState(false);
    const [localLikes, setLocalLikes] = useState(likesCount);

    const handleLike = useCallback(() => {
      const next = !liked;
      setLiked(next);
      setLocalLikes(prev => prev + (next ? 1 : -1));
      // brief scale-pop feedback flag
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 300);
      // onLike?.(id, next);
      if (next) AccessibilityInfo.announceForAccessibility('Post liked');
    }, [liked, id]);

    const handleDoubleTap = useCallback(() => {
      if (!liked) handleLike();
    }, [liked, handleLike]);

    return (
      <View style={styles.card}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.userRow}
            //   onPress={() => onUserPress?.(userId)}
            accessibilityRole="button"
            accessibilityLabel={`View ${username}'s profile`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: userAvatar }}
                style={styles.avatar}
                accessibilityLabel={`${username}'s avatar`}
              />
            </View>

            {/* Username + location */}
            <View style={styles.userInfo}>
              <View style={styles.usernameRow}>
                <Text style={styles.username} numberOfLines={1}>
                  {username}
                </Text>
                {/* {user.isVerified && <VerifiedBadge />} */}
              </View>
              {location && (
                <Text style={styles.location} numberOfLines={1}>
                  {location}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* More options */}
          <TouchableOpacity
            //   onPress={() => onMoreOptions?.(id)}
            style={styles.moreBtn}
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <InfoIcon size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* ── Post Image ── */}
        <Pressable
          onPress={handleDoubleTap}
          accessibilityRole="image"
          accessibilityLabel={caption ?? `Post by ${username}`}
          accessibilityHint="Double-tap to like"
        >
          {media[0].type === 'image' ? (
            <Image
              source={{ uri: media[0].thumbnailUrl }}
              style={[
                styles.postImage,
                {
                  height:
                    media[0].height *
                    ((SCREEN_WIDTH - Spacing.lg * 2) / media[0].width),
                },
              ]}
              resizeMode="cover"
            />
          ) : (
            <View style={StyleSheet.absoluteFill}>
              <Video
                source={{ uri: media[0].url }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                ignoreSilentSwitch="ignore"
                playInBackground={false}
                playWhenInactive={false}
              />
            </View>
          )}
        </Pressable>

        {/* ── Action Bar ── */}
        <View style={styles.actions}>
          <View style={styles.actionsLeft}>
            {/* Like */}
            <TouchableOpacity
              onPress={handleLike}
              style={[styles.actionBtn, likeAnim && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityState={{ checked: liked }}
              accessibilityLabel={liked ? 'Unlike post' : 'Like post'}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Image
                source={require('../assets/images/like-outline.png')}
                style={{ width: 18, height: 18 }}
              />
              <Text style={styles.likesText}>{formatCount(localLikes)} </Text>
            </TouchableOpacity>

            {/* Comment */}
            <TouchableOpacity
              // onPress={() => onComment?.(id)}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel={`${commentsCount} comments, tap to view`}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Image
                source={require('../assets/images/comment.png')}
                style={{ width: 18, height: 18 }}
              />
              <Text style={styles.likesText}>
                {formatCount(commentsCount)}{' '}
              </Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
              //onPress={() => onShare?.(id)}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="Share post"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Image
                source={require('../assets/images/share.png')}
                style={{ width: 18, height: 18 }}
              />
              <Text style={styles.likesText}>{formatCount(sharesCount)} </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.meta}>
          {/* ── Caption ── */}
          {caption && (
            <View style={styles.captionRow}>
              <Text style={styles.captionText}>{caption}</Text>
            </View>
          )}

          {/* ── Hashtags ── */}
          {hashtags.length > 0 && (
            <Text style={styles.hashtags} numberOfLines={2}>
              {hashtags.map(t => `#${t}`).join(' ')}
            </Text>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: '#fff',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: 20,
    overflow: 'hidden',
    // Neumorphic shadow pair
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    borderWidth: 2,
    borderColor: INDIGO[200],
    shadowColor: INDIGO[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },

  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },

  userInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },

  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  username: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.1,
  },

  location: {
    fontSize: 11,
    color: '#f0f0f0',
    marginTop: 1,
  },

  moreBtn: {
    paddingLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
  },

  postImage: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },

  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  actionBtn: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },

  actionBtnPressed: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    elevation: 0,
  },

  meta: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.xs,
    gap: Spacing.xs,
  },

  likesText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.05,
  },

  likesLabel: {
    fontWeight: '600',
  },

  captionRow: {
    flexDirection: 'column',
    marginTop: 2,
  },

  captionUsername: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  captionText: {
    fontSize: 13.5,
    color: Colors.textPrimary,
    lineHeight: 19,
    flex: 1,
    flexWrap: 'wrap',
  },

  hashtags: {
    fontSize: 13,
    color: INDIGO[600],
    fontWeight: '600',
    letterSpacing: 0.1,
    marginTop: 2,
  },

  viewComments: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  timestamp: {
    fontSize: 11,
    color: Colors.textTertiary,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    marginTop: Spacing.xs,
  },
});
