import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import BreadcrumbNav from '@/components/BreadcrumbNav.jsx';
import { MessageSquare, Heart, Clock, User, Send, AlertCircle } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge.jsx';

const DiscussionDetailPage = () => {
  const { discussionId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDiscussionData = async () => {
    try {
      const discRecord = await pb.collection('discussions').getOne(discussionId, { 
        expand: 'userId',
        $autoCancel: false 
      });
      setDiscussion(discRecord);

      const repliesRecords = await pb.collection('discussionReplies').getList(1, 100, {
        filter: `discussionId="${discussionId}"`,
        sort: 'createdAt',
        expand: 'userId',
        $autoCancel: false
      });
      setReplies(repliesRecords.items);
    } catch (err) {
      console.error("Error fetching discussion:", err);
      setError("Discussion not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussionData();
  }, [discussionId]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await pb.collection('discussionReplies').create({
        discussionId: discussionId,
        userId: currentUser.id,
        content: replyContent,
        likes: 0
      }, { $autoCancel: false });

      setReplyContent('');
      await fetchDiscussionData(); // Refresh replies
    } catch (err) {
      console.error("Failed to post reply:", err);
      alert("Failed to post reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (type, item) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const collection = type === 'discussion' ? 'discussions' : 'discussionReplies';
    const filterStr = type === 'discussion' 
      ? `discussionId="${item.id}" && userId="${currentUser.id}" && replyId=""`
      : `replyId="${item.id}" && userId="${currentUser.id}"`;

    try {
      const existingLikes = await pb.collection('discussionLikes').getList(1, 1, {
        filter: filterStr,
        $autoCancel: false
      });

      if (existingLikes.items.length > 0) {
        // Unlike
        await pb.collection('discussionLikes').delete(existingLikes.items[0].id, { $autoCancel: false });
        await pb.collection(collection).update(item.id, { likes: Math.max(0, item.likes - 1) }, { $autoCancel: false });
      } else {
        // Like
        const likeData = { userId: currentUser.id };
        if (type === 'discussion') likeData.discussionId = item.id;
        else likeData.replyId = item.id;
        
        await pb.collection('discussionLikes').create(likeData, { $autoCancel: false });
        await pb.collection(collection).update(item.id, { likes: item.likes + 1 }, { $autoCancel: false });
      }
      
      fetchDiscussionData(); // Refresh to show updated likes
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  
  if (error || !discussion) return (
    <div className="min-h-screen bg-background py-20 text-center">
      <AlertCircle size={48} className="mx-auto text-destructive mb-4" />
      <h2 className="text-2xl font-bold text-foreground mb-4">{error}</h2>
      <button onClick={() => navigate('/community/discussions')} className="text-primary hover:underline">Back to Discussions</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-12">
      <Helmet>
        <title>{discussion.title} | Unfoold Discussions</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-4xl">
        <BreadcrumbNav items={[
          { label: 'Community', path: '/community/events' },
          { label: 'Discussions', path: '/community/discussions' },
          { label: 'Thread', path: '#' }
        ]} />

        {/* Main Discussion Post */}
        <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                {discussion.category}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock size={14} /> {new Date(discussion.createdAt).toLocaleString()}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{discussion.title}</h1>
            
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border/50">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-primary border border-border overflow-hidden">
                {discussion.expand?.userId?.avatar ? (
                  <img src={pb.files.getUrl(discussion.expand.userId, discussion.expand.userId.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div>
                <p className="font-bold text-foreground flex items-center gap-1">{discussion.expand?.userId?.name || 'Anonymous'}{discussion.expand?.userId?.isVerified && <VerifiedBadge size={16} />}</p>
                <p className="text-xs text-muted-foreground">Author</p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none mb-8">
              <p className="text-lg text-foreground/90 leading-relaxed whitespace-pre-wrap">{discussion.content}</p>
            </div>

            <div className="flex items-center gap-6 pt-6 border-t border-border">
              <button 
                onClick={() => handleLike('discussion', discussion)}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="p-2 bg-secondary rounded-full group-hover:bg-primary/10 transition-colors">
                  <Heart size={20} className={discussion.likes > 0 ? 'fill-primary text-primary' : ''} />
                </div>
                <span className="font-bold">{discussion.likes || 0} Likes</span>
              </button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="p-2 bg-secondary rounded-full">
                  <MessageSquare size={20} />
                </div>
                <span className="font-bold">{replies.length} Replies</span>
              </div>
            </div>
          </div>
        </div>

        {/* Replies Section */}
        <div className="space-y-6 mb-12">
          <h3 className="text-xl font-bold text-foreground px-2">Replies</h3>
          
          {replies.length === 0 ? (
            <div className="text-center py-12 bg-secondary/50 rounded-xl border border-border border-dashed">
              <p className="text-muted-foreground">No replies yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            replies.map(reply => (
              <div key={reply.id} className="bg-card rounded-xl p-6 border border-border shadow-sm flex gap-4">
                <div className="w-10 h-10 bg-secondary rounded-full flex-shrink-0 flex items-center justify-center text-primary overflow-hidden">
                  {reply.expand?.userId?.avatar ? (
                    <img src={pb.files.getUrl(reply.expand.userId, reply.expand.userId.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-foreground flex items-center gap-1">{reply.expand?.userId?.name || 'Anonymous'}{reply.expand?.userId?.isVerified && <VerifiedBadge size={14} />}</span>
                    <span className="text-xs text-muted-foreground">{new Date(reply.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-foreground/90 whitespace-pre-wrap mb-4">{reply.content}</p>
                  <button 
                    onClick={() => handleLike('reply', reply)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Heart size={14} className={reply.likes > 0 ? 'fill-primary text-primary' : ''} />
                    <span>{reply.likes || 0}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply Form */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
          <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" /> Leave a Reply
          </h4>
          {currentUser ? (
            <form onSubmit={handleReplySubmit}>
              <textarea 
                rows="4"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply here..."
                className="w-full bg-secondary border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:border-primary resize-none mb-4"
                required
              ></textarea>
              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={isSubmitting || !replyContent.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Send size={16} /> {isSubmitting ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 bg-secondary rounded-lg border border-border">
              <p className="text-muted-foreground mb-4">You must be logged in to post a reply.</p>
              <button onClick={() => navigate('/login')} className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90">
                Log In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetailPage;