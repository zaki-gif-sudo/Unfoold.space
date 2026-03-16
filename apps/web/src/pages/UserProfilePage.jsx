import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { withRetry } from '@/utils/apiErrorHandler.js';
import { ArrowLeft, Users, Grid3X3, Award, Heart, MessageCircle, Lock, UserPlus } from 'lucide-react';

const TIER_CONFIG = {
  'Coffee Guest': { color: 'text-stone-500 bg-stone-100 border-stone-300', label: 'Guest' },
  'Bronze': { color: 'text-amber-700 bg-amber-100 border-amber-300', label: 'Bronze' },
  'Silver': { color: 'text-gray-600 bg-gray-100 border-gray-300', label: 'Silver' },
  'Gold': { color: 'text-yellow-600 bg-yellow-100 border-yellow-300', label: 'Gold' },
  'Platinum': { color: 'text-purple-600 bg-purple-100 border-purple-300', label: 'Platinum' },
};

const UserProfilePage = () => {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postLikes, setPostLikes] = useState({});
  const [postCommentCounts, setPostCommentCounts] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const isOwn = currentUser?.id === userId;

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await withRetry(() => pb.collection('users').getOne(userId, { $autoCancel: false }));
      setUser(userData);

      // Fetch follow counts
      const [followers, following] = await Promise.all([
        withRetry(() => pb.collection('follows').getList(1, 1, { filter: `followingId="${userId}"`, $autoCancel: false })),
        withRetry(() => pb.collection('follows').getList(1, 1, { filter: `followerId="${userId}"`, $autoCancel: false })),
      ]);
      setFollowerCount(followers.totalItems);
      setFollowingCount(following.totalItems);

      // Check if current user follows
      if (currentUser && currentUser.id !== userId) {
        const check = await withRetry(() => pb.collection('follows').getList(1, 1, {
          filter: `followerId="${currentUser.id}" && followingId="${userId}"`,
          $autoCancel: false
        }));
        setIsFollowing(check.totalItems > 0);

        // Check if there's a pending follow request
        if (userData.isPrivate && check.totalItems === 0) {
          try {
            const reqCheck = await withRetry(() => pb.collection('followRequests').getList(1, 1, {
              filter: `requesterId="${currentUser.id}" && targetId="${userId}" && status="pending"`,
              $autoCancel: false
            }));
            setHasPendingRequest(reqCheck.totalItems > 0);
          } catch (e) {}
        }
      }

      // Fetch user's posts
      const userPosts = await withRetry(() => pb.collection('moments').getList(1, 100, {
        filter: `userId="${userId}"`,
        sort: '-created',
        $autoCancel: false
      }));
      setPosts(userPosts.items);

      // Fetch like counts and comment counts for posts
      if (userPosts.items.length > 0) {
        const allLikes = await withRetry(() => pb.collection('momentLikes').getFullList({ $autoCancel: false }));
        const likes = {};
        userPosts.items.forEach(p => {
          likes[p.id] = allLikes.filter(l => l.momentId === p.id).length;
        });
        setPostLikes(likes);

        const allComments = await withRetry(() => pb.collection('momentComments').getFullList({ $autoCancel: false }));
        const commentCounts = {};
        userPosts.items.forEach(p => {
          commentCounts[p.id] = allComments.filter(c => c.momentId === p.id).length;
        });
        setPostCommentCounts(commentCounts);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleFollow = async () => {
    if (!currentUser) { navigate('/login'); return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const existing = await withRetry(() => pb.collection('follows').getList(1, 1, {
          filter: `followerId="${currentUser.id}" && followingId="${userId}"`,
          $autoCancel: false
        }));
        if (existing.items.length > 0) {
          await withRetry(() => pb.collection('follows').delete(existing.items[0].id, { $autoCancel: false }));
        }
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await withRetry(() => pb.collection('follows').create({
          followerId: currentUser.id,
          followingId: userId
        }, { $autoCancel: false }));
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleFollowRequest = async () => {
    if (!currentUser) { navigate('/login'); return; }
    setFollowLoading(true);
    try {
      await withRetry(() => pb.collection('followRequests').create({
        requesterId: currentUser.id,
        targetId: userId,
        status: 'pending'
      }, { $autoCancel: false }));
      setHasPendingRequest(true);
    } catch (err) {
      console.error('Follow request failed:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setFollowLoading(true);
    try {
      const existing = await withRetry(() => pb.collection('followRequests').getList(1, 1, {
        filter: `requesterId="${currentUser.id}" && targetId="${userId}" && status="pending"`,
        $autoCancel: false
      }));
      if (existing.items.length > 0) {
        await withRetry(() => pb.collection('followRequests').delete(existing.items[0].id, { $autoCancel: false }));
      }
      setHasPendingRequest(false);
    } catch (err) {
      console.error('Cancel request failed:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const isPrivate = !!user?.isPrivate;
  const showContent = isOwn || !isPrivate || isFollowing;

  const tier = user?.membershipLevel || 'Bronze';
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG['Bronze'];
  const avatar = user?.avatar ? pb.files.getURL(user, user.avatar, { thumb: '200x200' }) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-24 bg-muted rounded" />
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-muted" />
              <div className="space-y-3 flex-1"><div className="h-5 w-32 bg-muted rounded" /><div className="h-4 w-48 bg-muted rounded" /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">{[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-muted rounded-lg" />)}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl text-center py-20">
          <p className="text-muted-foreground text-lg">Pengguna tidak ditemukan</p>
          <button onClick={() => navigate('/social')} className="mt-4 text-primary hover:underline">Kembali ke Social</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <Helmet><title>{user.name} | Unfoold Social</title></Helmet>

      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
          <ArrowLeft size={18} /> Kembali
        </button>

        {/* Profile header */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            {avatar ? (
              <img src={avatar} alt={user.name} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-border flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground border-2 border-border flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Name + tier */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground truncate">{user.name}</h1>
                {isPrivate && <Lock size={14} className="text-muted-foreground" />}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${tierCfg.color}`}>
                  <Award size={12} className="inline mr-0.5 -mt-0.5" />
                  {tierCfg.label}
                </span>
              </div>

              {/* Stats */}
              <div className="flex gap-5 mt-3 text-sm">
                <div><span className="font-bold text-foreground">{posts.length}</span> <span className="text-muted-foreground">post</span></div>
                <div><span className="font-bold text-foreground">{followerCount}</span> <span className="text-muted-foreground">pengikut</span></div>
                <div><span className="font-bold text-foreground">{followingCount}</span> <span className="text-muted-foreground">mengikuti</span></div>
              </div>

              {/* Follow button */}
              {currentUser && !isOwn && (
                isFollowing ? (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="mt-3 px-6 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-muted text-foreground border border-border hover:bg-destructive/10 hover:text-destructive"
                  >
                    {followLoading ? '...' : 'Unfollow'}
                  </button>
                ) : isPrivate ? (
                  hasPendingRequest ? (
                    <button
                      onClick={handleCancelRequest}
                      disabled={followLoading}
                      className="mt-3 px-6 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-muted text-muted-foreground border border-border hover:bg-destructive/10 hover:text-destructive"
                    >
                      {followLoading ? '...' : 'Diminta'}
                    </button>
                  ) : (
                    <button
                      onClick={handleFollowRequest}
                      disabled={followLoading}
                      className="mt-3 px-6 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-primary text-primary-foreground hover:opacity-90"
                    >
                      {followLoading ? '...' : <><UserPlus size={14} className="inline mr-1" />Minta Ikuti</>}
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="mt-3 px-6 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-primary text-primary-foreground hover:opacity-90"
                  >
                    {followLoading ? '...' : 'Follow'}
                  </button>
                )
              )}

              {isOwn && (
                <Link to="/profile" className="mt-3 inline-block px-6 py-1.5 rounded-lg text-sm font-medium bg-muted text-foreground border border-border hover:bg-muted/70">
                  Edit Profil
                </Link>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="mt-4 text-sm text-foreground whitespace-pre-line">{user.bio}</p>
          )}
        </div>

        {/* Posts grid */}
        {!showContent ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Lock size={48} className="mx-auto text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-lg font-bold text-foreground mb-2">Akun ini Privat</h3>
            <p className="text-muted-foreground text-sm">Ikuti akun ini untuk melihat foto dan story mereka.</p>
          </div>
        ) : (
          <>
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <Grid3X3 size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">Post</span>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Grid3X3 size={40} className="mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="text-muted-foreground">Belum ada post</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {posts.map(post => {
              const photos = Array.isArray(post.photo) ? post.photo : [post.photo];
              const thumb = pb.files.getURL(post, photos[0], { thumb: '300x300' });
              return (
                <button key={post.id} onClick={() => setSelectedPost(post)} className="aspect-square relative group overflow-hidden rounded-lg bg-muted">
                  <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-4 text-white text-sm font-medium">
                      <span className="flex items-center gap-1"><Heart size={16} className="fill-white" /> {postLikes[post.id] || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={16} className="fill-white" /> {postCommentCounts[post.id] || 0}</span>
                    </div>
                  </div>
                  {photos.length > 1 && (
                    <div className="absolute top-2 right-2 text-white"><Grid3X3 size={14} /></div>
                  )}
                </button>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>

      {/* Post detail modal */}
      {selectedPost && (() => {
        const photos = Array.isArray(selectedPost.photo) ? selectedPost.photo : [selectedPost.photo];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div className="relative bg-card rounded-2xl border border-border overflow-hidden max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <img src={pb.files.getURL(selectedPost, photos[0])} alt="" className="w-full aspect-square object-contain bg-black" />
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {avatar ? (
                    <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className="font-semibold text-foreground text-sm">{user.name}</p>
                </div>
                {selectedPost.caption && <p className="text-foreground text-sm mb-2">{selectedPost.caption}</p>}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart size={16} /> {postLikes[selectedPost.id] || 0} suka</span>
                  <span className="flex items-center gap-1"><MessageCircle size={16} /> {postCommentCounts[selectedPost.id] || 0} komentar</span>
                </div>
              </div>
              <button onClick={() => setSelectedPost(null)} className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 text-lg">&times;</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default UserProfilePage;
