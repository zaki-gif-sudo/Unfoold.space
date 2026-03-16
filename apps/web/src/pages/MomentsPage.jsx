import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import BreadcrumbNav from '@/components/BreadcrumbNav.jsx';
import { Camera, Heart, MessageCircle, MessageCircleOff, Send, X, Plus, ImagePlus, ChevronLeft, ChevronRight, AlertTriangle, RefreshCw, Trash2, MoreVertical } from 'lucide-react';
import SquareCropPreview from '@/components/SquareCropPreview.jsx';
import { withRetry } from '@/utils/apiErrorHandler.js';

const MomentsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
        <div className="aspect-square bg-muted" />
        <div className="p-4 space-y-2">
          <div className="h-4 w-1/3 bg-muted rounded" />
          <div className="h-4 w-2/3 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
        </div>
      </div>
    ))}
  </div>
);

const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const MomentsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Image carousel state
  const [carouselIndex, setCarouselIndex] = useState({});

  // Post menu
  const [openPostMenu, setOpenPostMenu] = useState(null);

  const fetchMoments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await withRetry(() => pb.collection('moments').getList(1, 50, {
        sort: '-created',
        $autoCancel: false
      }));
      setMoments(records.items);

      // Fetch user profiles for moment authors
      const uniqueUserIds = [...new Set(records.items.map(m => m.userId))];
      const usersObj = {};
      for (const uid of uniqueUserIds) {
        try {
          const user = await pb.collection('users').getOne(uid, { $autoCancel: false });
          usersObj[uid] = user;
        } catch (e) { /* user not found */ }
      }
      setUsersMap(usersObj);

      // Fetch all likes to count per moment + track user likes
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
      setError('Gagal memuat moments. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMoments();
  }, [fetchMoments]);

  // Resolve user name from moment
  const getUserName = (moment) => {
    return usersMap[moment.userId]?.name || 'Anonim';
  };

  const getUserAvatar = (moment) => {
    const user = usersMap[moment.userId];
    if (user?.avatar) {
      return pb.files.getURL(user, user.avatar, { thumb: '40x40' });
    }
    return null;
  };

  // Photo URL helper
  const getPhotoURL = (moment, filename, thumb) => {
    const opts = thumb ? { thumb } : {};
    return pb.files.getURL(moment, filename, opts);
  };

  // Upload handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setUploadFiles(validFiles);
    const previews = validFiles.map(f => URL.createObjectURL(f));
    setUploadPreviews(previews);
  };

  const removePreview = (index) => {
    const newFiles = uploadFiles.filter((_, i) => i !== index);
    const newPreviews = uploadPreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(uploadPreviews[index]);
    setUploadFiles(newFiles);
    setUploadPreviews(newPreviews);
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

      // Cleanup
      uploadPreviews.forEach(p => URL.revokeObjectURL(p));
      cropRefs.current = [];
      setUploadFiles([]);
      setUploadPreviews([]);
      setUploadCaption('');
      setIsUploadOpen(false);
      fetchMoments();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Gagal mengupload foto. Coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  // Like handlers
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
        await withRetry(() => pb.collection('momentLikes').create({
          momentId: moment.id,
          userId: currentUser.id
        }, { $autoCancel: false }));
        setUserLikes(prev => new Set([...prev, moment.id]));
        setLikeCounts(prev => ({ ...prev, [moment.id]: (prev[moment.id] || 0) + 1 }));
      }
    } catch (err) {
      console.error('Like failed:', err);
    } finally {
      setLikingMoment(null);
    }
  };

  // Comment handlers
  const toggleComments = async (momentId) => {
    const isOpen = openComments[momentId];
    setOpenComments(prev => ({ ...prev, [momentId]: !isOpen }));

    if (!isOpen && !comments[momentId]) {
      setLoadingComments(prev => ({ ...prev, [momentId]: true }));
      try {
        const recs = await withRetry(() => pb.collection('momentComments').getList(1, 100, {
          filter: `momentId="${momentId}"`,
          sort: '-created',
          $autoCancel: false
        }));

        // Fetch user names for comments
        const commentUserIds = [...new Set(recs.items.map(c => c.userId))];
        const newUsersMap = { ...usersMap };
        for (const uid of commentUserIds) {
          if (!newUsersMap[uid]) {
            try {
              newUsersMap[uid] = await pb.collection('users').getOne(uid, { $autoCancel: false });
            } catch (e) { /* user not found */ }
          }
        }
        setUsersMap(newUsersMap);

        setComments(prev => ({ ...prev, [momentId]: recs.items }));
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setLoadingComments(prev => ({ ...prev, [momentId]: false }));
      }
    }
  };

  const handleComment = async (momentId) => {
    if (!currentUser) { navigate('/login'); return; }
    const text = (commentTexts[momentId] || '').trim();
    if (!text) return;

    setSubmittingComment(prev => ({ ...prev, [momentId]: true }));
    try {
      const newComment = await withRetry(() => pb.collection('momentComments').create({
        momentId,
        userId: currentUser.id,
        content: text
      }, { $autoCancel: false }));

      // Ensure current user is in usersMap
      if (!usersMap[currentUser.id]) {
        setUsersMap(prev => ({ ...prev, [currentUser.id]: currentUser }));
      }

      setComments(prev => ({
        ...prev,
        [momentId]: [newComment, ...(prev[momentId] || [])]
      }));
      setCommentTexts(prev => ({ ...prev, [momentId]: '' }));
    } catch (err) {
      console.error('Comment failed:', err);
      alert('Gagal mengirim komentar.');
    } finally {
      setSubmittingComment(prev => ({ ...prev, [momentId]: false }));
    }
  };

  const handleDeleteMoment = async (moment) => {
    if (!currentUser || currentUser.id !== moment.userId) return;
    if (!window.confirm('Hapus moment ini?')) return;
    try {
      await withRetry(() => pb.collection('moments').delete(moment.id, { $autoCancel: false }));
      setMoments(prev => prev.filter(m => m.id !== moment.id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Gagal menghapus moment.');
    }
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

  // Carousel 
  const nextPhoto = (momentId, total) => {
    setCarouselIndex(prev => ({ ...prev, [momentId]: ((prev[momentId] || 0) + 1) % total }));
  };
  const prevPhoto = (momentId, total) => {
    setCarouselIndex(prev => ({ ...prev, [momentId]: ((prev[momentId] || 0) - 1 + total) % total }));
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <Helmet>
        <title>Moments | Unfoold Espresso</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-3xl">
        <BreadcrumbNav items={[
          { label: 'Community', path: '/community/events' },
          { label: 'Moments', path: '/community/moments' }
        ]} />

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Camera size={32} /> Moments
            </h1>
            <p className="text-muted-foreground">Bagikan momen serumu di Unfoold Espresso!</p>
          </div>
          <button
            onClick={() => currentUser ? setIsUploadOpen(true) : navigate('/login')}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity shadow-md whitespace-nowrap"
          >
            <Plus size={20} /> Upload Foto
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle size={20} />
              <p className="font-medium">{error}</p>
            </div>
            <button onClick={fetchMoments} className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md text-sm font-medium hover:bg-muted transition-colors border border-border">
              <RefreshCw size={14} /> Coba Lagi
            </button>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <MomentsSkeleton />
        ) : moments.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <Camera size={48} className="mx-auto text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-xl font-bold text-foreground mb-2">Belum ada moments</h3>
            <p className="text-muted-foreground mb-6">Jadilah yang pertama membagikan momen serumu!</p>
            <button onClick={() => currentUser ? setIsUploadOpen(true) : navigate('/login')} className="text-foreground font-bold hover:underline">
              Upload sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {moments.map(moment => {
              const photos = Array.isArray(moment.photo) ? moment.photo : [moment.photo];
              const currentIdx = carouselIndex[moment.id] || 0;
              const isLiked = userLikes.has(moment.id);
              const momentComments = comments[moment.id] || [];
              const isCommentsOpen = openComments[moment.id];

              return (
                <div key={moment.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                  {/* User header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      {getUserAvatar(moment) ? (
                        <img src={getUserAvatar(moment)} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
                          {getUserName(moment).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground text-sm">{getUserName(moment)}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(moment.created)}</p>
                      </div>
                    </div>
                    {currentUser?.id === moment.userId && (
                      <div className="relative">
                        <button onClick={() => setOpenPostMenu(openPostMenu === moment.id ? null : moment.id)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                          <MoreVertical size={20} />
                        </button>
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
                        <img key={i} src={getPhotoURL(moment, photo)} alt="Moment" className="w-full h-full object-cover flex-shrink-0" loading="lazy" />
                      ))}
                    </div>
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={() => prevPhoto(moment.id, photos.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                        >
                          <ChevronLeft size={22} />
                        </button>
                        <button
                          onClick={() => nextPhoto(moment.id, photos.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                        >
                          <ChevronRight size={22} />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {photos.map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIdx ? 'bg-white' : 'bg-white/40'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center gap-4 mb-2">
                      <button
                        onClick={() => handleLike(moment)}
                        disabled={likingMoment === moment.id}
                        className="flex items-center gap-1.5 transition-colors hover:opacity-70 disabled:opacity-50"
                      >
                        <Heart
                          size={24}
                          className={isLiked ? 'fill-red-500 text-red-500' : 'text-foreground'}
                        />
                      </button>
                      {!moment.commentsDisabled && (
                        <button
                          onClick={() => toggleComments(moment.id)}
                          className="flex items-center gap-1.5 transition-colors hover:opacity-70"
                        >
                          <MessageCircle size={24} className="text-foreground" />
                        </button>
                      )}
                    </div>

                    {(likeCounts[moment.id] || 0) > 0 && (
                      <p className="font-semibold text-foreground text-sm mb-1">
                        {likeCounts[moment.id]} suka
                      </p>
                    )}

                    {moment.caption && (
                      <p className="text-foreground text-sm mb-1">
                        <span className="font-semibold mr-1.5">{getUserName(moment)}</span>
                        {moment.caption}
                      </p>
                    )}

                    {moment.commentsDisabled ? (
                      <p className="text-muted-foreground text-xs mt-1">Komentar dinonaktifkan</p>
                    ) : (
                      <button
                        onClick={() => toggleComments(moment.id)}
                        className="text-muted-foreground text-sm hover:underline"
                      >
                        {isCommentsOpen ? 'Sembunyikan komentar' : 'Lihat komentar'}
                      </button>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wide">{formatDate(moment.created)}</p>
                  </div>

                  {/* Comments section */}
                  {isCommentsOpen && !moment.commentsDisabled && (
                    <div className="px-4 pb-4 border-t border-border mt-2 pt-3">
                      {loadingComments[moment.id] ? (
                        <div className="text-center py-3 text-muted-foreground text-sm">Memuat komentar...</div>
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
                                  <span className="font-semibold mr-1.5">{usersMap[comment.userId]?.name || 'Anonim'}</span>
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

                      {/* Comment input */}
                      {currentUser ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={commentTexts[moment.id] || ''}
                            onChange={(e) => setCommentTexts(prev => ({ ...prev, [moment.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleComment(moment.id)}
                            placeholder="Tulis komentar..."
                            maxLength={500}
                            className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                          />
                          <button
                            onClick={() => handleComment(moment.id)}
                            disabled={submittingComment[moment.id] || !(commentTexts[moment.id] || '').trim()}
                            className="text-primary hover:opacity-70 transition-opacity disabled:opacity-30 p-2"
                          >
                            <Send size={18} />
                          </button>
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
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isUploading && setIsUploadOpen(false)} />
          <div className="relative bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Upload Moment</h2>
              <button onClick={() => !isUploading && setIsUploadOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              {/* File picker */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {uploadPreviews.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video bg-background border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-foreground transition-colors"
                  >
                    <ImagePlus size={40} className="text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-foreground font-medium">Pilih Foto</p>
                      <p className="text-muted-foreground text-xs mt-1">Maksimal 5 foto (JPG, PNG, GIF, WebP)</p>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {uploadPreviews.map((p, i) => (
                        <div key={i} className="relative border border-border rounded-lg">
                          <SquareCropPreview ref={el => { cropRefs.current[i] = el; }} src={p} />
                          <button
                            type="button"
                            onClick={() => removePreview(i)}
                            className="absolute top-1 right-1 z-10 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {uploadPreviews.length < 5 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-foreground transition-colors"
                        >
                          <Plus size={24} className="text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Caption</label>
                <textarea
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Tulis caption untuk moment kamu..."
                  maxLength={500}
                  rows="3"
                  className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{uploadCaption.length}/500</p>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => !isUploading && setIsUploadOpen(false)}
                  className="px-6 py-2 text-foreground hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || uploadFiles.length === 0}
                  className="px-8 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isUploading ? 'Mengupload...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MomentsPage;
