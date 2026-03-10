import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import BreadcrumbNav from '@/components/BreadcrumbNav.jsx';
import { MessageSquare, Heart, Plus, X, Filter, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { withRetry } from '@/utils/apiErrorHandler.js';

const CATEGORIES = ['All', 'Coffee Talk', 'Ideas & Creativity', 'Meetups', 'General'];

const DiscussionsSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex gap-3 mb-2">
            <div className="h-6 w-20 bg-muted rounded"></div>
            <div className="h-6 w-24 bg-muted rounded"></div>
          </div>
          <div className="h-6 w-3/4 bg-muted rounded mb-2"></div>
          <div className="h-4 w-full bg-muted rounded mb-4"></div>
          <div className="h-4 w-1/3 bg-muted rounded"></div>
        </div>
        <div className="h-16 w-12 bg-muted rounded-lg"></div>
      </div>
    ))}
  </div>
);

const DiscussionsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDiscussions = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await withRetry(() => pb.collection('discussions').getList(1, 50, {
        sort: '-createdAt',
        expand: 'userId',
        $autoCancel: false
      }));
      
      const replies = await withRetry(() => pb.collection('discussionReplies').getFullList({ $autoCancel: false }));
      
      const enrichedDiscussions = records.items.map(disc => {
        const replyCount = replies.filter(r => r.discussionId === disc.id).length;
        return { ...disc, replyCount };
      });

      setDiscussions(enrichedDiscussions);
      localStorage.setItem('cachedDiscussions', JSON.stringify(enrichedDiscussions));
    } catch (err) {
      console.error("Error fetching discussions:", err);
      setError(err.userMessage || "Failed to load discussions.");
      
      const cached = localStorage.getItem('cachedDiscussions');
      if (cached) {
        setDiscussions(JSON.parse(cached));
        setError("You are offline. Showing cached discussions.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      await withRetry(() => pb.collection('discussions').create({
        title: newTitle,
        content: newContent,
        category: newCategory,
        userId: currentUser.id,
        likes: 0
      }, { $autoCancel: false }));

      setIsModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewCategory('General');
      fetchDiscussions();
    } catch (err) {
      console.error("Failed to create discussion:", err);
      alert(err.userMessage || "Failed to post discussion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (e, discussion) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const existingLikes = await withRetry(() => pb.collection('discussionLikes').getList(1, 1, {
        filter: `discussionId="${discussion.id}" && userId="${currentUser.id}"`,
        $autoCancel: false
      }));

      if (existingLikes.items.length > 0) {
        await withRetry(() => pb.collection('discussionLikes').delete(existingLikes.items[0].id, { $autoCancel: false }));
        await withRetry(() => pb.collection('discussions').update(discussion.id, { likes: Math.max(0, discussion.likes - 1) }, { $autoCancel: false }));
      } else {
        await withRetry(() => pb.collection('discussionLikes').create({
          discussionId: discussion.id,
          userId: currentUser.id
        }, { $autoCancel: false }));
        await withRetry(() => pb.collection('discussions').update(discussion.id, { likes: discussion.likes + 1 }, { $autoCancel: false }));
      }
      
      fetchDiscussions();
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const filteredDiscussions = activeCategory === 'All' 
    ? discussions 
    : discussions.filter(d => d.category === activeCategory);

  return (
    <div className="min-h-screen bg-background py-12">
      <Helmet>
        <title>Community Discussions | Unfoold Espresso</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-5xl">
        <BreadcrumbNav items={[
          { label: 'Community', path: '/community/events' },
          { label: 'Discussions', path: '/community/discussions' }
        ]} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Discussions</h1>
            <p className="text-muted-foreground">Share ideas, ask questions, and connect with the community.</p>
          </div>
          <button 
            onClick={() => currentUser ? setIsModalOpen(true) : navigate('/login')}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity shadow-md whitespace-nowrap"
          >
            <Plus size={20} /> Start Discussion
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle size={20} />
              <p className="font-medium">{error}</p>
            </div>
            <button onClick={fetchDiscussions} className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md text-sm font-medium hover:bg-muted transition-colors border border-border">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide border-b border-border">
          <Filter size={18} className="text-muted-foreground mr-2 flex-shrink-0" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors border ${
                activeCategory === cat 
                  ? 'bg-foreground text-background border-foreground' 
                  : 'bg-background text-muted-foreground border-transparent hover:text-foreground hover:bg-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Discussions List */}
        {loading ? (
          <DiscussionsSkeleton />
        ) : filteredDiscussions.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <MessageSquare size={48} className="mx-auto text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-xl font-bold text-foreground mb-2">No discussions yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to start a conversation in this category.</p>
            <button onClick={() => setIsModalOpen(true)} className="text-foreground font-bold hover:underline">Start a topic</button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDiscussions.map(disc => (
              <Link 
                to={`/community/discussions/${disc.id}`} 
                key={disc.id}
                className="block bg-card rounded-xl p-6 border border-border hover:border-foreground transition-all hover:shadow-md group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-foreground bg-muted px-2 py-1 rounded-md border border-border">
                        {disc.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} /> {new Date(disc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:opacity-70 transition-opacity">{disc.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{disc.content}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground/80">By {disc.expand?.userId?.name || 'Anonymous'}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={14} /> {disc.replyCount} Replies</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1 bg-background p-3 rounded-lg border border-border">
                    <button 
                      onClick={(e) => handleLike(e, disc)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      <Heart size={20} className={disc.likes > 0 ? 'fill-foreground text-foreground' : ''} />
                    </button>
                    <span className="font-bold text-foreground">{disc.likes || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Start a Discussion</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleCreateDiscussion} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                <input 
                  type="text" 
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Content</label>
                <textarea 
                  required
                  rows="6"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share your thoughts, ideas, or questions..."
                  className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground resize-none"
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-foreground hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-8 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Post Discussion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionsPage;