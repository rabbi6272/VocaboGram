import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from './FirebaseConfig';

import { Post } from '../types/Post';

export async function getFeed(lastDoc?: any | null): Promise<{
  posts: Post[];
  lastDoc: any | null;
  hasMore: boolean;
}> {
  const PAGE_SIZE = 15;

  let feedQuery = query(
    collection(db, 'posts'),
    where('type', '==', 'post'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE),
  );

  if (lastDoc) feedQuery = query(feedQuery, startAfter(lastDoc));

  const snapshot = await getDocs(feedQuery);

  const posts = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Post[];

  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;

  return {
    posts,
    lastDoc: newLastDoc,
    hasMore: snapshot.docs.length >= PAGE_SIZE,
  };
}

export async function getReels(lastDoc?: any | null): Promise<{
  reels: Post[];
  lastDoc: any | null;
  hasMore: boolean;
}> {
  const pageSize = 5;

  let reelsQuery = query(
    collection(db, 'posts'),
    where('type', '==', 'reel'),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );

  if (lastDoc) reelsQuery = query(reelsQuery, startAfter(lastDoc));

  const snapshot = await getDocs(reelsQuery);

  const reels = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Post[];

  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;

  return {
    reels: reels,
    lastDoc: newLastDoc,
    hasMore: snapshot.docs.length >= pageSize,
  };
}

export const getUserPosts = async (
  userId: string,
  lastDoc?: any | null,
): Promise<any> => {
  const pageSize = 10;

  let userPostsQuery = query(
    collection(db, 'posts'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );
  if (lastDoc) userPostsQuery = query(userPostsQuery, startAfter(lastDoc));

  const snap = await getDocs(userPostsQuery);
  return {
    posts: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
  };
};

export const getPost = async (postId: string): Promise<any> => {
  const snap = await getDoc(doc(db, 'posts', postId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getComments = async (
  postId: string,
  lastDoc = null,
  pageSize = 20,
): Promise<any> => {
  let q = query(
    collection(db, 'comments'),
    where('postId', '==', postId),
    orderBy('createdAt', 'asc'),
    limit(pageSize),
  );
  if (lastDoc) q = query(q, startAfter(lastDoc));

  const snap = await getDocs(q);
  return {
    comments: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
  };
};

export const getFollowers = async (userId: string): Promise<any> => {
  const q = query(
    collection(db, 'follows'),
    where('followingId', '==', userId),
    where('status', '==', 'accepted'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data().followerId);
};

export const getPostsByHashtag = async (
  tag: string,
  pageSize = 12,
): Promise<any> => {
  const q = query(
    collection(db, 'posts'),
    where('hashtags', 'array-contains', tag),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getUser = async (userId: string): Promise<any> => {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
