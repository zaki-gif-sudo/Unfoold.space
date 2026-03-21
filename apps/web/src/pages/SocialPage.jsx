import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import BreadcrumbNav from '@/components/BreadcrumbNav.jsx';
import { Camera, Heart, MessageCircle, MessageCircleOff, Send, X, Plus, ImagePlus, ChevronLeft, ChevronRight, AlertTriangle, RefreshCw, Trash2, Search, Users, Award, Lock, Bell, Check, UserPlus, Eye, ChevronUp, MoreVertical } from 'lucide-react';
import SquareCropPreview from '@/components/SquareCropPreview.jsx';
import VerifiedBadge from '@/components/VerifiedBadge.jsx';
import { withRetry } from '@/utils/apiErrorHandler.js';

const TIER_CONFIG = {
  'Coffee Guest': { color: 'text-stone-500 bg-stone-100', label: 'Guest' },
  'Bronze': { color: 'text-amber-700 bg-amber-100', label: 'Bronze' },
  'Silver': { color: 'text-gray-500 bg-gray-100', label: 'Silver' },
  'Gold': { color: 'text-yellow-600 bg-yellow-100', label: 'Gold' },
  'Platinum': { color: 'text-purple-600 bg-purple-100', label: 'Platinum' },
};

const FeedSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-muted" />
          <div className="space-y-1.5"><div className="h-3 w-24 bg-muted rounded" /><div className="h-2 w-16 bg-muted rounded" /></div>
        </div>
        <div className="aspect-square bg-muted" />
        <div className="p-4 space-y-2"><div className="h-4 w-1/3 bg-muted rounded" /><div className="h-4 w-2/3 bg-muted rounded" /></div>
      </div>
    ))}
  </div>
);

const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const SocialPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState('feed');

  // Feed state
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stories
  const [stories, setStories] = useState([]);
  const [storyUsers, setStoryUsers] = useState({});
  const [viewingStory, setViewingStory] = useState(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isStoryUploadOpen, setIsStoryUploadOpen] = useState(false);
  const [storyFile, setStoryFile] = useState(null);
  const [storyPreview, setStoryPreview] = useState(null);
  const [storyCaption, setStoryCaption] = useState('');
  const [isStoryUploading, setIsStoryUploading] = useState(false);
  const storyFileRef = useRef(null);
  const storyTimerRef = useRef(null);

  // Upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [uploadCaption, setUploadCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const cropRefs = useRef([]);

  // Comment state
  const [openComments, setOpenComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});
  const [comments, setComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  // Likes state
  const [userLikes, setUserLikes] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [likingMoment, setLikingMoment] = useState(null);

  // Users cache
  const [usersMap, setUsersMap] = useState({});

  // Image carousel
  const [carouselIndex, setCarouselIndex] = useState({});

  // Post menu
  const [openPostMenu, setOpenPostMenu] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followCounts, setFollowCounts] = useState({});
  const [myFollowing, setMyFollowing] = useState(new Set());

  // Story views (to track which story users have been viewed)
  const [viewedStoryUsers, setViewedStoryUsers] = useState(new Set());

  // Story viewers
  const [storyViewers, setStoryViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const [loadingViewers, setLoadingViewers] = useState(false);

  // Follow requests (for notification badge)
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myPendingRequests, setMyPendingRequests] = useState(new Set()); // requests I sent that are pending
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // ============ STORIES ============
  const fetchStories = useCallback(async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recs = await withRetry(() => pb.collection('stories').getFullList({
        filter: `created >= "${twentyFourHoursAgo}"`,
        sort: '-created',
        $autoCancel: false
      }));

      // Group by userId
      const grouped = {};
      recs.forEach(s => {
        if (!grouped[s.userId]) grouped[s.userId] = [];
        grouped[s.userId].push(s);
      });

      // Fetch user data
      const uids = Object.keys(grouped);
      const users = {};
      for (const uid of uids) {
        if (!usersMap[uid]) {
          try { users[uid] = await pb.collection('users').getOne(uid, { $autoCancel: false }); } catch (e) {}
        } else {
          users[uid] = usersMap[uid];
        }
      }
      setStoryUsers(prev => ({ ...prev, ...users }));
      setUsersMap(prev => ({ ...prev, ...users }));

      // Filter out stories from private accounts the current user doesn't follow
      const allUsers = { ...usersMap, ...users };
      let myFollowingIds = new Set();
      if (currentUser) {
        try {
          const followRecs = await withRetry(() => pb.collection('follows').getFullList({
            filter: `followerId="${currentUser.id}"`,
            $autoCancel: false
          }));
          myFollowingIds = new Set(followRecs.map(r => r.followingId));
        } catch (e) {}
      }

      const filteredStories = Object.entries(grouped)
        .filter(([userId]) => {
          if (currentUser && userId === currentUser.id) return true;
          const u = allUsers[userId];
          if (u?.isPrivate && !myFollowingIds.has(userId)) return false;
          return true;
        })
        .map(([userId, items]) => ({ userId, items }));
      setStories(filteredStories);

      // Fetch viewed story users for current user
      if (currentUser) {
        try {
          const views = await withRetry(() => pb.collection('storyViews').getFullList({
            filter: `viewerId="${currentUser.id}"`,
            $autoCancel: false
          }));
          setViewedStoryUsers(new Set(views.map(v => v.storyUserId)));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    }
  }, []);

  const handleStoryUpload = async (e) => {
    e.preventDefault();
    if (!currentUser || !storyFile) return;
    setIsStoryUploading(true);
    try {
      const fd = new FormData();
      fd.append('userId', currentUser.id);
      fd.append('photo', storyFile);
      fd.append('caption', storyCaption.trim());
      await withRetry(() => pb.collection('stories').create(fd, { $autoCancel: false }));
      if (storyPreview) URL.revokeObjectURL(storyPreview);
      setStoryFile(null);
      setStoryPreview(null);
      setStoryCaption('');
      setIsStoryUploadOpen(false);
      fetchStories();
    } catch (err) {
      console.error('Story upload failed:', err);
      alert('Gagal mengupload story.');
    } finally {
      setIsStoryUploading(false);
    }
  };

  const openStory = (userStory, idx = 0) => {
    setViewingStory(userStory);
    setStoryIndex(idx);
    startStoryTimer(userStory, idx);
    // Mark story as viewed
    if (currentUser && !viewedStoryUsers.has(userStory.userId) && userStory.userId !== currentUser.id) {
      setViewedStoryUsers(prev => new Set([...prev, userStory.userId]));
      pb.collection('storyViews').create({
        storyUserId: userStory.userId,
        viewerId: currentUser.id
      }, { $autoCancel: false }).catch(() => {});
    }
  };

  const startStoryTimer = (userStory, idx) => {
    if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    storyTimerRef.current = setTimeout(() => {
      if (idx < userStory.items.length - 1) {
        setStoryIndex(idx + 1);
        startStoryTimer(userStory, idx + 1);
      } else {
        setViewingStory(null);
      }
    }, 5000);
  };

  const closeStory = () => {
    if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    setViewingStory(null);
    setShowViewers(false);
    setStoryViewers([]);
  };

  const fetchStoryViewers = async (storyUserId) => {
    setLoadingViewers(true);
    try {
      const views = await withRetry(() => pb.collection('storyViews').getFullList({
        filter: `storyUserId="${storyUserId}"`,
        sort: '-created',
        $autoCancel: false
      }));
      const viewerIds = [...new Set(views.map(v => v.viewerId))];
      const viewers = await Promise.all(
        viewerIds.map(id =>
          usersMap[id] ? Promise.resolve(usersMap[id]) :
          pb.collection('users').getOne(id, { $autoCancel: false }).catch(() => null)
        )
      );
      setStoryViewers(viewers.filter(Boolean));
    } catch (e) {
      console.error('Error fetching story viewers:', e);
    } finally {
      setLoadingViewers(false);
    }
  };

  // ============ FEED ============
  const fetchMoments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await withRetry(() => pb.collection('moments').getList(1, 50, {
        sort: '-created',
        $autoCancel: false
      }));

      const uniqueUserIds = [...new Set(records.items.map(m => m.userId))];
      const usersObj = { ...usersMap };
      for (const uid of uniqueUserIds) {
        if (!usersObj[uid]) {
          try { usersObj[uid] = await pb.collection('users').getOne(uid, { $autoCancel: false }); } catch (e) {}
        }
      }
      setUsersMap(usersObj);

      // Filter out posts from private accounts the current user doesn't follow
      let myFollowingIds = new Set();
      if (currentUser) {
        try {
          const followRecs = await withRetry(() => pb.collection('follows').getFullList({
            filter: `followerId="${currentUser.id}"`,
            $autoCancel: false
          }));
          myFollowingIds = new Set(followRecs.map(r => r.followingId));
        } catch (e) {}
      }

      const filteredItems = records.items.filter(m => {
        if (currentUser && m.userId === currentUser.id) return true;
        const postUser = usersObj[m.userId];
        if (postUser?.isPrivate && !myFollowingIds.has(m.userId)) return false;
        return true;
      });
      setMoments(filteredItems);

      const allLikes = await withRetry(() => pb.collection('momentLikes').getFullList({ $autoCancel: false }));
      const counts = {};
      const myLikes = new Set();
      allLikes.forEach(l => {
        counts[l.momentId] = (counts[l.momentId] || 0) + 1;
        if (currentUser && l.userId === currentUser.id) myLikes.add(l.momentId);
      });
      setLikeCounts(counts);
      setUserLikes(myLikes);
    } catch (err) {
      console.error('Error fetching moments:', err);
      setError('Gagal memuat feed.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ============ SEARCH ============
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const safeQuery = query.trim().replace(/"/g, '\\"');
      const res = await withRetry(() => pb.collection('users').getList(1, 20, {
        filter: `name ~ "${safeQuery}"`,
        $autoCancel: false
      }));
      setSearchResults(res.items.filter(u => u.id !== currentUser?.id));

      // Fetch follow counts for results
      const ids = res.items.map(u => u.id);
      const allFollows = await withRetry(() => pb.collection('follows').getFullList({ $autoCancel: false }));
      const fc = {};
      ids.forEach(id => {
        fc[id] = {
          followers: allFollows.filter(f => f.followingId === id).length,
          following: allFollows.filter(f => f.followerId === id).length
        };
      });
      setFollowCounts(fc);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [currentUser]);

  // Debounce search
  const searchTimerRef = useRef(null);
  const onSearchChange = (val) => {
    setSearchQuery(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => handleSearch(val), 400);
  };

  // ============ FOLLOW ============
  const fetchMyFollowing = useCallback(async () => {
    if (!currentUser) return;
    try {
      const recs = await withRetry(() => pb.collection('follows').getFullList({
        filter: `followerId="${currentUser.id}"`,
        $autoCancel: false
      }));
      setMyFollowing(new Set(recs.map(r => r.followingId)));
    } catch (e) {}
  }, [currentUser]);

  const handleFollow = async (userId) => {
    if (!currentUser) { navigate('/login'); return; }
    const isFollowing = myFollowing.has(userId);
    try {
      if (isFollowing) {
        const existing = await withRetry(() => pb.collection('follows').getList(1, 1, {
          filter: `followerId="${currentUser.id}" && followingId="${userId}"`,
          $autoCancel: false
        }));
        if (existing.items.length > 0) {
          await withRetry(() => pb.collection('follows').delete(existing.items[0].id, { $autoCancel: false }));
        }
        setMyFollowing(prev => { const n = new Set(prev); n.delete(userId); return n; });
        setFollowCounts(prev => ({ ...prev, [userId]: { ...prev[userId], followers: Math.max(0, (prev[userId]?.followers || 0) - 1) } }));
      } else {
        await withRetry(() => pb.collection('follows').create({
          followerId: currentUser.id,
          followingId: userId
        }, { $autoCancel: false }));
        setMyFollowing(prev => new Set([...prev, userId]));
        setFollowCounts(prev => ({ ...prev, [userId]: { ...prev[userId], followers: (prev[userId]?.followers || 0) + 1 } }));
      }
    } catch (err) {
      console.error('Follow failed:', err);
    }
  };

  // ============ LIKES ============
  const handleLike = async (moment) => {
    if (!currentUser) { navigate('/login'); return; }
    if (likingMoment) return;
    setLikingMoment(moment.id);
    const isLiked = userLikes.has(moment.id);
    try {
      if (isLiked) {
        const existing = await withRetry(() => pb.collection('momentLikes').getList(1, 1, {
          filter: `momentId="${moment.id}" && userId="${currentUser.id}"`,
          $autoCancel: false
        }));
        if (existing.items.length > 0) {
          await withRetry(() => pb.collection('momentLikes').delete(existing.items[0].id, { $autoCancel: false }));
        }
        setUserLikes(prev => { const n = new Set(prev); n.delete(moment.id); return n; });
        setLikeCounts(prev => ({ ...prev, [moment.id]: Math.max(0, (prev[moment.id] || 0) - 1) }));
      } else {
        await withRetry(() => pb.collection('momentLikes').create({ momentId: moment.id, userId: currentUser.id }, { $autoCancel: false }));
        setUserLikes(prev => new Set([...prev, moment.id]));
        setLikeCounts(prev => ({ ...prev, [moment.id]: (prev[moment.id] || 0) + 1 }));
      }
    } catch (err) { console.error('Like failed:', err); }
    finally { setLikingMoment(null); }
  };

  // ============ COMMENTS ============
  const toggleComments = async (momentId) => {
    const isOpen = openComments[momentId];
    setOpenComments(prev => ({ ...prev, [momentId]: !isOpen }));
    if (!isOpen && !comments[momentId]) {
      setLoadingComments(prev => ({ ...prev, [momentId]: true }));
      try {
        const recs = await withRetry(() => pb.collection('momentComments').getList(1, 100, {
          filter: `momentId="${momentId}"`, sort: '-created', $autoCancel: false
        }));
        const commentUserIds = [...new Set(recs.items.map(c => c.userId))];
        const newUsersMap = { ...usersMap };
        for (const uid of commentUserIds) {
          if (!newUsersMap[uid]) {
            try { newUsersMap[uid] = await pb.collection('users').getOne(uid, { $autoCancel: false }); } catch (e) {}
          }
        }
        setUsersMap(newUsersMap);
        setComments(prev => ({ ...prev, [momentId]: recs.items }));
      } catch (err) { console.error('Failed to load comments:', err); }
      finally { setLoadingComments(prev => ({ ...prev, [momentId]: false })); }
    }
  };

  const handleComment = async (momentId) => {
    if (!currentUser) { navigate('/login'); return; }
    const text = (commentTexts[momentId] || '').trim();
    if (!text) return;
    setSubmittingComment(prev => ({ ...prev, [momentId]: true }));
    try {
      const newComment = await withRetry(() => pb.collection('momentComments').create({
        momentId, userId: currentUser.id, content: text
      }, { $autoCancel: false }));
      if (!usersMap[currentUser.id]) setUsersMap(prev => ({ ...prev, [currentUser.id]: currentUser }));
      setComments(prev => ({ ...prev, [momentId]: [newComment, ...(prev[momentId] || [])] }));
      setCommentTexts(prev => ({ ...prev, [momentId]: '' }));
    } catch (err) { console.error('Comment failed:', err); alert('Gagal mengirim komentar.'); }
    finally { setSubmittingComment(prev => ({ ...prev, [momentId]: false })); }
  };

  // ============ UPLOAD ============
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;
    setUploadFiles(validFiles);
    setUploadPreviews(validFiles.map(f => URL.createObjectURL(f)));
  };

  const removePreview = (index) => {
    URL.revokeObjectURL(uploadPreviews[index]);
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
    setUploadPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!currentUser) { navigate('/login'); return; }
    if (uploadFiles.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('userId', currentUser.id);
      formData.append('caption', uploadCaption.trim());
      formData.append('likes', 0);
      const croppedBlobs = await Promise.all(
        uploadFiles.map((_, i) => cropRefs.current[i]?.getCroppedBlob?.() || Promise.resolve(null))
      );
      croppedBlobs.forEach((blob, i) => {
        formData.append('photo', blob || uploadFiles[i], blob ? `photo_${i}.jpg` : uploadFiles[i].name);
      });
      await withRetry(() => pb.collection('moments').create(formData, { $autoCancel: false }));
      uploadPreviews.forEach(p => URL.revokeObjectURL(p));
      cropRefs.current = [];
      setUploadFiles([]); setUploadPreviews([]); setUploadCaption(''); setIsUploadOpen(false);
      fetchMoments();
    } catch (err) { console.error('Upload failed:', err); alert('Gagal mengupload foto.'); }
    finally { setIsUploading(false); }
  };

  const handleDeleteMoment = async (moment) => {
    if (!currentUser || currentUser.id !== moment.userId) return;
    if (!window.confirm('Hapus post ini?')) return;
    try {
      await withRetry(() => pb.collection('moments').delete(moment.id, { $autoCancel: false }));
      setMoments(prev => prev.filter(m => m.id !== moment.id));
    } catch (err) { console.error('Delete failed:', err); alert('Gagal menghapus post.'); }
    setOpenPostMenu(null);
  };

  const handleToggleComments = async (moment) => {
    if (!currentUser || currentUser.id !== moment.userId) return;
    try {
      await withRetry(() => pb.collection('moments').update(moment.id, { commentsDisabled: !moment.commentsDisabled }, { $autoCancel: false }));
      setMoments(prev => prev.map(m => m.id === moment.id ? { ...m, commentsDisabled: !m.commentsDisabled } : m));
    } catch (err) { console.error('Toggle comments failed:', err); alert('Gagal mengubah pengaturan komentar.'); }
    setOpenPostMenu(null);
  };

  const handleDeleteComment = async (momentId, commentId) => {
    if (!currentUser) return;
    if (!window.confirm('Hapus komentar ini?')) return;
    try {
      await withRetry(() => pb.collection('momentComments').delete(commentId, { $autoCancel: false }));
      setComments(prev => ({ ...prev, [momentId]: (prev[momentId] || []).filter(c => c.id !== commentId) }));
    } catch (err) { console.error('Delete comment failed:', err); alert('Gagal menghapus komentar.'); }
  };

  // Helpers
  const getUserName = (uid) => usersMap[uid]?.name || 'Anonim';
  const getUserAvatar = (uid) => {
    const user = usersMap[uid];
    if (user?.avatar) return pb.files.getURL(user, user.avatar, { thumb: '40x40' });
    return null;
  };
  const getUserTier = (uid) => usersMap[uid]?.membershipLevel || 'Bronze';
  const isUserVerified = (uid) => !!usersMap[uid]?.isVerified;
  const getPhotoURL = (record, filename, thumb) => pb.files.getURL(record, filename, thumb ? { thumb } : {});
  const nextPhoto = (id, total) => setCarouselIndex(prev => ({ ...prev, [id]: ((prev[id] || 0) + 1) % total }));
  const prevPhoto = (id, total) => setCarouselIndex(prev => ({ ...prev, [id]: ((prev[id] || 0) - 1 + total) % total }));

  // ============ FOLLOW REQUESTS (PRIVATE MODE) ============
  const fetchPendingRequests = useCallback(async () => {
    if (!currentUser) return;
    try {
      // Requests targeting me (I need to approve/reject)
      const incoming = await withRetry(() => pb.collection('followRequests').getFullList({
        filter: `targetId="${currentUser.id}" && status="pending"`,
        sort: '-created',
        $autoCancel: false
      }));
      setPendingRequests(incoming);

      // Fetch user data for requesters
      const uids = incoming.map(r => r.requesterId);
      const usersObj = { ...usersMap };
      for (const uid of uids) {
        if (!usersObj[uid]) {
          try { usersObj[uid] = await pb.collection('users').getOne(uid, { $autoCancel: false }); } catch (e) {}
        }
      }
      setUsersMap(prev => ({ ...prev, ...usersObj }));

      // Requests I sent that are still pending
      const outgoing = await withRetry(() => pb.collection('followRequests').getFullList({
        filter: `requesterId="${currentUser.id}" && status="pending"`,
        $autoCancel: false
      }));
      setMyPendingRequests(new Set(outgoing.map(r => r.targetId)));
    } catch (e) {
      console.error('Error fetching follow requests:', e);
    }
  }, [currentUser]);

  const handleFollowRequest = async (userId) => {
    if (!currentUser) { navigate('/login'); return; }
    try {
      await withRetry(() => pb.collection('followRequests').create({
        requesterId: currentUser.id,
        targetId: userId,
        status: 'pending'
      }, { $autoCancel: false }));
      setMyPendingRequests(prev => new Set([...prev, userId]));
    } catch (err) {
      console.error('Follow request failed:', err);
    }
  };

  const handleCancelFollowRequest = async (userId) => {
    try {
      const existing = await withRetry(() => pb.collection('followRequests').getList(1, 1, {
        filter: `requesterId="${currentUser.id}" && targetId="${userId}" && status="pending"`,
        $autoCancel: false
      }));
      if (existing.items.length > 0) {
        await withRetry(() => pb.collection('followRequests').delete(existing.items[0].id, { $autoCancel: false }));
      }
      setMyPendingRequests(prev => { const n = new Set(prev); n.delete(userId); return n; });
    } catch (err) {
      console.error('Cancel request failed:', err);
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      // Update request status
      await withRetry(() => pb.collection('followRequests').update(request.id, { status: 'accepted' }, { $autoCancel: false }));
      // Create the follow
      await withRetry(() => pb.collection('follows').create({
        followerId: request.requesterId,
        followingId: currentUser.id
      }, { $autoCancel: false }));
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (err) {
      console.error('Accept request failed:', err);
    }
  };

  const handleRejectRequest = async (request) => {
    try {
      await withRetry(() => pb.collection('followRequests').update(request.id, { status: 'rejected' }, { $autoCancel: false }));
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (err) {
      console.error('Reject request failed:', err);
    }
  };

  // Init
  useEffect(() => {
    fetchMoments();
    fetchStories();
    fetchMyFollowing();
    fetchPendingRequests();
  }, [fetchMoments, fetchStories, fetchMyFollowing, fetchPendingRequests]);

  const TierBadge = ({ tier }) => {
    const cfg = TIER_CONFIG[tier] || TIER_CONFIG['Bronze'];
    return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>;
  };

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-background py-8">
      <Helmet><title>Social | Unfoold Espresso</title></Helmet>

      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Social</h1>
          <div className="flex gap-2 items-center">
            {currentUser && (
              <>
                {/* Notification badge for follow requests */}
                <div className="relative">
                  <button onClick={() => setShowNotifPanel(!showNotifPanel)} className="p-2 bg-muted rounded-full hover:bg-muted/70 transition-colors relative" title="Notifikasi">
                    <Bell size={20} className="text-foreground" />
                    {pendingRequests.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {pendingRequests.length > 9 ? '9+' : pendingRequests.length}
                      </span>
                    )}
                  </button>

                  {/* Notification Panel */}
                  {showNotifPanel && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-3 border-b border-border">
                        <h3 className="font-bold text-foreground text-sm">Permintaan Mengikuti</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {pendingRequests.length === 0 ? (
                          <div className="p-6 text-center text-muted-foreground text-sm">Tidak ada permintaan baru</div>
                        ) : (
                          pendingRequests.map(req => {
                            const reqUser = usersMap[req.requesterId];
                            const avatar = reqUser?.avatar ? pb.files.getURL(reqUser, reqUser.avatar, { thumb: '40x40' }) : null;
                            return (
                              <div key={req.id} className="flex items-center gap-3 p-3 border-b border-border last:border-0">
                                <Link to={`/social/user/${req.requesterId}`} onClick={() => setShowNotifPanel(false)} className="flex-shrink-0">
                                  {avatar ? (
                                    <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-border" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                                      {(reqUser?.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </Link>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">{reqUser?.name || 'Anonim'}{reqUser?.isVerified && <VerifiedBadge size={14} />}</p>
                                  <p className="text-xs text-muted-foreground">Ingin mengikuti Anda</p>
                                </div>
                                <div className="flex gap-1.5">
                                  <button onClick={() => handleAcceptRequest(req)} className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90" title="Terima">
                                    <Check size={14} />
                                  </button>
                                  <button onClick={() => handleRejectRequest(req)} className="p-1.5 bg-muted text-muted-foreground rounded-lg hover:bg-destructive/10 hover:text-destructive" title="Tolak">
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => setIsStoryUploadOpen(true)} className="p-2 bg-muted rounded-full hover:bg-muted/70 transition-colors" title="Tambah Story">
                  <Plus size={20} className="text-foreground" />
                </button>
                <button onClick={() => setIsUploadOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity text-sm">
                  <Camera size={16} className="inline mr-1.5" /> Post
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
          {[{ key: 'feed', label: 'Feed' }, { key: 'search', label: 'Cari' }].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab.key === 'search' && <Search size={14} className="inline mr-1" />}
              {tab.key === 'feed' && <Users size={14} className="inline mr-1" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ============ FEED TAB ============ */}
        {activeTab === 'feed' && (
          <>
            {/* Stories Row */}
            {stories.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                {/* Add story button */}
                {currentUser && (
                  <button onClick={() => setIsStoryUploadOpen(true)} className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                      <Plus size={20} className="text-muted-foreground" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">Story</span>
                  </button>
                )}
                {stories.map(userStory => {
                  const user = storyUsers[userStory.userId] || usersMap[userStory.userId];
                  const avatar = user?.avatar ? pb.files.getURL(user, user.avatar, { thumb: '40x40' }) : null;
                  const isViewed = viewedStoryUsers.has(userStory.userId) || userStory.userId === currentUser?.id;
                  return (
                    <button key={userStory.userId} onClick={() => openStory(userStory)} className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className={`w-16 h-16 rounded-full p-0.5 ${isViewed ? 'bg-muted-foreground/40' : 'bg-foreground'}`}>
                        <div className="w-full h-full rounded-full bg-background p-0.5">
                          {avatar ? (
                            <img src={avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {(user?.name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-foreground truncate w-16 text-center">{user?.name?.split(' ')[0] || '...'}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3 text-destructive"><AlertTriangle size={20} /><p className="font-medium text-sm">{error}</p></div>
                <button onClick={fetchMoments} className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md text-sm font-medium hover:bg-muted border border-border">
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            )}

            {loading ? <FeedSkeleton /> : moments.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <Camera size={48} className="mx-auto text-muted-foreground mb-4 opacity-30" />
                <h3 className="text-lg font-bold text-foreground mb-2">Belum ada post</h3>
                <p className="text-muted-foreground text-sm mb-4">Jadilah yang pertama membagikan momen!</p>
                {currentUser && (
                  <button onClick={() => setIsUploadOpen(true)} className="text-foreground font-bold hover:underline text-sm">Upload sekarang</button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {moments.map(moment => {
                  const photos = Array.isArray(moment.photo) ? moment.photo : [moment.photo];
                  const currentIdx = carouselIndex[moment.id] || 0;
                  const isLiked = userLikes.has(moment.id);
                  const momentComments = comments[moment.id] || [];
                  const isCommentsOpen = openComments[moment.id];
                  const tier = getUserTier(moment.userId);

                  return (
                    <div key={moment.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                      {/* Post header */}
                      <div className="flex items-center justify-between px-4 py-3">
                        <Link to={`/social/user/${moment.userId}`} className="flex items-center gap-3 hover:opacity-80">
                          {getUserAvatar(moment.userId) ? (
                            <img src={getUserAvatar(moment.userId)} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
                              {getUserName(moment.userId).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground text-sm">{getUserName(moment.userId)}</p>
                              {isUserVerified(moment.userId) && <VerifiedBadge size={14} />}
                              <TierBadge tier={tier} />
                            </div>
                            <p className="text-xs text-muted-foreground">{timeAgo(moment.created)}</p>
                          </div>
                        </Link>
                        {currentUser?.id === moment.userId && (
                          <div className="relative">
                            <button onClick={() => setOpenPostMenu(openPostMenu === moment.id ? null : moment.id)} className="text-muted-foreground hover:text-foreground transition-colors p-1"><MoreVertical size={20} /></button>
                            {openPostMenu === moment.id && (
                              <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenPostMenu(null)} />
                                <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-xl shadow-lg z-30 overflow-hidden">
                                  <button onClick={() => handleToggleComments(moment)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left">
                                    {moment.commentsDisabled ? <MessageCircle size={16} /> : <MessageCircleOff size={16} />}
                                    {moment.commentsDisabled ? 'Aktifkan Komentar' : 'Nonaktifkan Komentar'}
                                  </button>
                                  <button onClick={() => handleDeleteMoment(moment)} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-muted transition-colors text-left">
                                    <Trash2 size={16} />
                                    Hapus Postingan
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Photo carousel */}
                      <div className="relative aspect-square bg-black overflow-hidden"
                        onTouchStart={(e) => { e.currentTarget._touchX = e.touches[0].clientX; }}
                        onTouchEnd={(e) => {
                          const dx = e.changedTouches[0].clientX - (e.currentTarget._touchX || 0);
                          if (photos.length > 1) {
                            if (dx < -50) nextPhoto(moment.id, photos.length);
                            else if (dx > 50) prevPhoto(moment.id, photos.length);
                          }
                        }}
                      >
                        <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${currentIdx * 100}%)` }}>
                          {photos.map((photo, i) => (
                            <img key={i} src={getPhotoURL(moment, photo)} alt="Post" className="w-full h-full object-cover flex-shrink-0" loading="lazy" />
                          ))}
                        </div>
                        {photos.length > 1 && (
                          <>
                            <button onClick={() => prevPhoto(moment.id, photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"><ChevronLeft size={22} /></button>
                            <button onClick={() => nextPhoto(moment.id, photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"><ChevronRight size={22} /></button>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                              {photos.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIdx ? 'bg-white' : 'bg-white/40'}`} />)}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="px-4 pt-3 pb-2">
                        <div className="flex items-center gap-4 mb-2">
                          <button onClick={() => handleLike(moment)} disabled={likingMoment === moment.id} className="hover:opacity-70 disabled:opacity-50">
                            <Heart size={24} className={isLiked ? 'fill-red-500 text-red-500' : 'text-foreground'} />
                          </button>
                          {!moment.commentsDisabled && (
                            <button onClick={() => toggleComments(moment.id)} className="hover:opacity-70">
                              <MessageCircle size={24} className="text-foreground" />
                            </button>
                          )}
                        </div>
                        {(likeCounts[moment.id] || 0) > 0 && (
                          <p className="font-semibold text-foreground text-sm mb-1">{likeCounts[moment.id]} suka</p>
                        )}
                        {moment.caption && (
                          <p className="text-foreground text-sm mb-1">
                            <Link to={`/social/user/${moment.userId}`} className="font-semibold mr-1.5 hover:underline">{getUserName(moment.userId)}</Link>{isUserVerified(moment.userId) && <VerifiedBadge size={12} className="mr-1" />}
                            {moment.caption}
                          </p>
                        )}
                        {moment.commentsDisabled ? (
                          <p className="text-muted-foreground text-xs mt-1">Komentar dinonaktifkan</p>
                        ) : (
                          <button onClick={() => toggleComments(moment.id)} className="text-muted-foreground text-sm hover:underline">
                            {isCommentsOpen ? 'Sembunyikan komentar' : 'Lihat komentar'}
                          </button>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wide">{formatDate(moment.created)}</p>
                      </div>

                      {/* Comments */}
                      {isCommentsOpen && !moment.commentsDisabled && (
                        <div className="px-4 pb-4 border-t border-border mt-2 pt-3">
                          {loadingComments[moment.id] ? (
                            <div className="text-center py-3 text-muted-foreground text-sm">Memuat...</div>
                          ) : momentComments.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-2">Belum ada komentar</p>
                          ) : (
                            <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
                              {momentComments.map(comment => (
                                <div key={comment.id} className="flex gap-2">
                                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold flex-shrink-0 mt-0.5">
                                    {(usersMap[comment.userId]?.name || 'A').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground">
                                      <Link to={`/social/user/${comment.userId}`} className="font-semibold mr-1.5 hover:underline">{usersMap[comment.userId]?.name || 'Anonim'}</Link>{usersMap[comment.userId]?.isVerified && <VerifiedBadge size={12} className="mr-1" />}
                                      {comment.content}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(comment.created)}</p>
                                  </div>
                                  {(currentUser?.id === moment.userId || currentUser?.id === comment.userId) && (
                                    <button onClick={() => handleDeleteComment(moment.id, comment.id)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5 flex-shrink-0">
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {currentUser ? (
                            <div className="flex items-center gap-2">
                              <input type="text" value={commentTexts[moment.id] || ''} onChange={(e) => setCommentTexts(prev => ({ ...prev, [moment.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleComment(moment.id)} placeholder="Tulis komentar..." maxLength={500}
                                className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
                              <button onClick={() => handleComment(moment.id)} disabled={submittingComment[moment.id] || !(commentTexts[moment.id] || '').trim()}
                                className="text-primary hover:opacity-70 disabled:opacity-30 p-2"><Send size={18} /></button>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center">
                              <button onClick={() => navigate('/login')} className="text-foreground font-semibold hover:underline">Login</button> untuk berkomentar
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ============ SEARCH TAB ============ */}
        {activeTab === 'search' && (
          <div>
            {/* Search bar */}
            <div className="relative mb-6">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari nama pengguna..."
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                autoFocus
              />
            </div>

            {isSearching && <div className="text-center py-8 text-muted-foreground text-sm">Mencari...</div>}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <Search size={40} className="mx-auto text-muted-foreground mb-3 opacity-30" />
                <p className="text-muted-foreground">Tidak ditemukan pengguna "{searchQuery}"</p>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map(user => {
                  const avatar = user.avatar ? pb.files.getURL(user, user.avatar, { thumb: '40x40' }) : null;
                  const tier = user.membershipLevel || 'Bronze';
                  const fc = followCounts[user.id] || { followers: 0, following: 0 };
                  const isFollowing = myFollowing.has(user.id);
                  const isPrivate = !!user.isPrivate;
                  const hasPendingRequest = myPendingRequests.has(user.id);

                  return (
                    <div key={user.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                      <Link to={`/social/user/${user.id}`} className="flex-shrink-0">
                        {avatar ? (
                          <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                            {(user.name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/social/user/${user.id}`} className="hover:underline">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground text-sm truncate">{user.name}</p>
                            {user.isVerified && <VerifiedBadge size={14} />}
                            {isPrivate && <Lock size={12} className="text-muted-foreground" />}
                            <TierBadge tier={tier} />
                          </div>
                        </Link>
                        <p className="text-xs text-muted-foreground">{fc.followers} pengikut · {fc.following} mengikuti</p>
                      </div>
                      {currentUser && currentUser.id !== user.id && (
                        isFollowing ? (
                          <button
                            onClick={() => handleFollow(user.id)}
                            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors bg-muted text-foreground border border-border hover:bg-destructive/10 hover:text-destructive"
                          >
                            Unfollow
                          </button>
                        ) : isPrivate ? (
                          hasPendingRequest ? (
                            <button
                              onClick={() => handleCancelFollowRequest(user.id)}
                              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors bg-muted text-muted-foreground border border-border hover:bg-destructive/10 hover:text-destructive"
                            >
                              Diminta
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFollowRequest(user.id)}
                              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors bg-primary text-primary-foreground hover:opacity-90"
                            >
                              <UserPlus size={14} className="inline mr-1" />Minta
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleFollow(user.id)}
                            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors bg-primary text-primary-foreground hover:opacity-90"
                          >
                            Follow
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!searchQuery && !isSearching && (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <Users size={40} className="mx-auto text-muted-foreground mb-3 opacity-30" />
                <p className="text-muted-foreground text-sm">Ketik nama untuk mencari pengguna Unfoold</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============ STORY VIEWER ============ */}
      {viewingStory && (
        <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center" onClick={closeStory}>
          <div className="relative w-full max-w-md h-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Progress bars */}
            <div className="flex gap-1 p-3 absolute top-0 left-0 right-0 z-10">
              {viewingStory.items.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                  <div className={`h-full bg-white rounded-full ${i < storyIndex ? 'w-full' : i === storyIndex ? 'w-full animate-[storyProgress_5s_linear]' : 'w-0'}`} />
                </div>
              ))}
            </div>
            {/* User info */}
            <div className="absolute top-6 left-3 right-3 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(storyUsers[viewingStory.userId] || usersMap[viewingStory.userId])?.avatar ? (
                  <img src={pb.files.getURL(storyUsers[viewingStory.userId] || usersMap[viewingStory.userId], (storyUsers[viewingStory.userId] || usersMap[viewingStory.userId]).avatar, { thumb: '30x30' })} alt="" className="w-8 h-8 rounded-full object-cover border border-white/50" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                    {((storyUsers[viewingStory.userId] || usersMap[viewingStory.userId])?.name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-white text-sm font-semibold flex items-center gap-1">{(storyUsers[viewingStory.userId] || usersMap[viewingStory.userId])?.name || 'Anonim'}{(storyUsers[viewingStory.userId] || usersMap[viewingStory.userId])?.isVerified && <VerifiedBadge size={14} />}</p>
                  <p className="text-white/60 text-[10px]">{timeAgo(viewingStory.items[storyIndex]?.created)}</p>
                </div>
              </div>
              <button onClick={closeStory} className="text-white/80 hover:text-white p-1"><X size={24} /></button>
            </div>
            {/* Story image */}
            <img
              src={pb.files.getURL(viewingStory.items[storyIndex], viewingStory.items[storyIndex]?.photo)}
              alt="Story"
              className="w-full h-full object-contain"
            />
            {/* Viewers button (only for own stories) */}
            {currentUser && viewingStory.userId === currentUser.id && (
              <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-2 pb-3" onClick={e => e.stopPropagation()}>
                {/* Caption above viewers button */}
                {viewingStory.items[storyIndex]?.caption && (
                  <p className="text-white text-sm bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm max-w-[80%] text-center">{viewingStory.items[storyIndex].caption}</p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
                    setShowViewers(!showViewers);
                    if (!showViewers && storyViewers.length === 0) fetchStoryViewers(currentUser.id);
                  }}
                  className="flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm"
                >
                  <Eye size={16} />
                  <span>{showViewers ? 'Tutup' : 'Dilihat oleh'}</span>
                  <ChevronUp size={14} className={`transition-transform ${showViewers ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
            {/* Caption for other people's stories (no viewers button) */}
            {!(currentUser && viewingStory.userId === currentUser.id) && viewingStory.items[storyIndex]?.caption && (
              <div className="absolute bottom-6 left-0 right-0 text-center px-4">
                <p className="text-white text-sm bg-black/40 inline-block px-4 py-2 rounded-lg backdrop-blur-sm">{viewingStory.items[storyIndex].caption}</p>
              </div>
            )}

            {/* Viewers panel */}
            {showViewers && (
              <div className="absolute bottom-24 left-0 right-0 z-20 max-h-[40vh] overflow-y-auto bg-black/80 backdrop-blur-md rounded-t-2xl border-t border-white/10" onClick={e => e.stopPropagation()}>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-3">Dilihat oleh {storyViewers.length} orang</h3>
                  {loadingViewers ? (
                    <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>
                  ) : storyViewers.length === 0 ? (
                    <p className="text-white/50 text-sm text-center py-3">Belum ada yang melihat</p>
                  ) : (
                    <div className="space-y-3">
                      {storyViewers.map(viewer => (
                        <div key={viewer.id} className="flex items-center gap-3">
                          {viewer.avatar ? (
                            <img src={pb.files.getURL(viewer, viewer.avatar, { thumb: '40x40' })} alt="" className="w-9 h-9 rounded-full object-cover border border-white/20" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                              {(viewer.name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-white text-sm font-medium flex items-center gap-1">{viewer.name || 'Anonim'}{viewer.isVerified && <VerifiedBadge size={12} />}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tap zones */}
            <div className="absolute inset-0 flex">
              <div className="w-1/2" onClick={() => {
                if (storyIndex > 0) { setStoryIndex(storyIndex - 1); startStoryTimer(viewingStory, storyIndex - 1); }
              }} />
              <div className="w-1/2" onClick={() => {
                if (storyIndex < viewingStory.items.length - 1) { setStoryIndex(storyIndex + 1); startStoryTimer(viewingStory, storyIndex + 1); }
                else closeStory();
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ============ STORY UPLOAD MODAL ============ */}
      {isStoryUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isStoryUploading && setIsStoryUploadOpen(false)} />
          <div className="relative bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-foreground">Buat Story</h2>
              <button onClick={() => !isStoryUploading && setIsStoryUploadOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={22} /></button>
            </div>
            <form onSubmit={handleStoryUpload} className="space-y-4">
              <input ref={storyFileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && f.type.startsWith('image/')) { setStoryFile(f); setStoryPreview(URL.createObjectURL(f)); }
              }} className="hidden" />
              {!storyPreview ? (
                <button type="button" onClick={() => storyFileRef.current?.click()} className="w-full aspect-[9/16] max-h-60 bg-background border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-foreground transition-colors">
                  <ImagePlus size={36} className="text-muted-foreground" />
                  <p className="text-foreground text-sm font-medium">Pilih Foto</p>
                </button>
              ) : (
                <div className="relative aspect-[9/16] max-h-60 rounded-xl overflow-hidden border border-border">
                  <img src={storyPreview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { URL.revokeObjectURL(storyPreview); setStoryFile(null); setStoryPreview(null); }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"><X size={16} /></button>
                </div>
              )}
              <input type="text" value={storyCaption} onChange={(e) => setStoryCaption(e.target.value)} placeholder="Caption (opsional)" maxLength={200}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
              <button type="submit" disabled={isStoryUploading || !storyFile} className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 disabled:opacity-50 text-sm">
                {isStoryUploading ? 'Mengupload...' : 'Upload Story'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============ POST UPLOAD MODAL ============ */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isUploading && setIsUploadOpen(false)} />
          <div className="relative bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Buat Post</h2>
              <button onClick={() => !isUploading && setIsUploadOpen(false)} className="text-muted-foreground hover:text-foreground p-1"><X size={24} /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-5">
              <div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={handleFileSelect} className="hidden" />
                {uploadPreviews.length === 0 ? (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full aspect-video bg-background border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-foreground transition-colors">
                    <ImagePlus size={40} className="text-muted-foreground" />
                    <div className="text-center"><p className="text-foreground font-medium">Pilih Foto</p><p className="text-muted-foreground text-xs mt-1">Maks 10 foto</p></div>
                  </button>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {uploadPreviews.map((p, i) => (
                      <div key={i} className="relative border border-border rounded-lg">
                        <SquareCropPreview ref={el => { cropRefs.current[i] = el; }} src={p} />
                        <button type="button" onClick={() => removePreview(i)} className="absolute top-1 right-1 z-10 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"><X size={14} /></button>
                      </div>
                    ))}
                    {uploadPreviews.length < 5 && (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-foreground transition-colors">
                        <Plus size={24} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Caption</label>
                <textarea value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} placeholder="Tulis caption..." maxLength={500} rows="3"
                  className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground resize-none" />
                <p className="text-xs text-muted-foreground mt-1 text-right">{uploadCaption.length}/500</p>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <button type="button" onClick={() => !isUploading && setIsUploadOpen(false)} className="px-6 py-2 text-foreground hover:bg-muted rounded-lg border border-transparent hover:border-border">Batal</button>
                <button type="submit" disabled={isUploading || uploadFiles.length === 0} className="px-8 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 disabled:opacity-50">
                  {isUploading ? 'Mengupload...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes storyProgress {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SocialPage;
