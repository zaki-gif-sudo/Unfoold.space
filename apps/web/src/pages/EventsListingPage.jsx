import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import BreadcrumbNav from '@/components/BreadcrumbNav.jsx';
import { Calendar, Clock, Users, Filter, AlertTriangle, RefreshCw } from 'lucide-react';
import { withRetry } from '@/utils/apiErrorHandler.js';

const CATEGORY_IMAGES = {
  'Coffee Cupping': 'https://images.unsplash.com/photo-1558996260-4bac67dbd110',
  'Creative Talks': 'https://images.unsplash.com/photo-1601893211509-81b6d03e46a0',
  'Open Mic Night': 'https://images.unsplash.com/flagged/photo-1582318734861-7e90a4a6c62c',
  'Startup Meetups': 'https://images.unsplash.com/photo-1549045345-058277380fc3',
  'Acoustic Night': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7'
};

const CATEGORIES = ['All', 'Coffee Cupping', 'Creative Talks', 'Open Mic Night', 'Startup Meetups', 'Acoustic Night'];

const EventsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
        <div className="h-56 bg-muted"></div>
        <div className="p-6">
          <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-full mb-2"></div>
          <div className="h-4 bg-muted rounded w-5/6 mb-6"></div>
          <div className="flex justify-between pt-4 border-t border-border">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const EventsListingPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await withRetry(() => pb.collection('events').getList(1, 50, {
        sort: 'date',
        $autoCancel: false
      }));
      setEvents(records.items);
      localStorage.setItem('cachedEvents', JSON.stringify(records.items));
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.userMessage || "Failed to load events.");
      
      const cached = localStorage.getItem('cachedEvents');
      if (cached) {
        setEvents(JSON.parse(cached));
        setError("You are offline. Showing cached events.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = activeCategory === 'All' 
    ? events 
    : events.filter(e => e.category === activeCategory);

  return (
    <div className="min-h-screen bg-background py-12">
      <Helmet>
        <title>Community Events | Unfoold Espresso</title>
      </Helmet>

      <div className="container mx-auto px-4">
        <BreadcrumbNav items={[
          { label: 'Community', path: '/community/events' },
          { label: 'Events', path: '/community/events' }
        ]} />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Community Events</h1>
            <p className="text-lg text-muted-foreground">
              Discover workshops, tastings, and gatherings designed to connect coffee enthusiasts and creative minds.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle size={20} />
              <p className="font-medium">{error}</p>
            </div>
            <button onClick={fetchEvents} className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md text-sm font-medium hover:bg-muted transition-colors border border-border">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          <Filter size={20} className="text-muted-foreground mr-2 flex-shrink-0" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all border ${
                activeCategory === cat 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background text-foreground border-border hover:border-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <EventsSkeleton />
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <Calendar size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-foreground mb-2">No events found</h3>
            <p className="text-muted-foreground">Check back later for new community gatherings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map(event => {
              const registeredCount = event.registeredUsers ? event.registeredUsers.length : 0;
              const isFull = registeredCount >= event.capacity;
              const imageUrl = event.image 
                ? pb.files.getUrl(event, event.image) 
                : (CATEGORY_IMAGES[event.category] || CATEGORY_IMAGES['Coffee Cupping']);

              return (
                <Link 
                  to={`/community/events/${event.id}`} 
                  key={event.id} 
                  className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1"
                >
                  <div className="h-56 relative overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={event.title} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent"></div>
                    
                    <div className="absolute top-4 left-4">
                      <span className="bg-background/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-foreground border border-border">
                        {event.category || 'Event'}
                      </span>
                    </div>
                    
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div className="bg-background/90 backdrop-blur-md px-3 py-2 rounded-lg border border-border text-center min-w-[60px]">
                        <div className="text-xs text-foreground font-bold uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</div>
                        <div className="text-xl font-bold text-foreground leading-none">{new Date(event.date).getDate()}</div>
                      </div>
                      {isFull && (
                        <span className="bg-foreground text-background text-xs font-bold px-2 py-1 rounded">SOLD OUT</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:opacity-70 transition-opacity line-clamp-2">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mb-6 flex-1 line-clamp-3">{event.description}</p>
                    
                    <div className="space-y-3 pt-4 border-t border-border text-sm text-foreground/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>{registeredCount}/{event.capacity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsListingPage;