import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import BreadcrumbNav from '@/components/BreadcrumbNav.jsx';
import { Calendar, Clock, Users, MapPin, User, Bookmark, CheckCircle, AlertCircle } from 'lucide-react';

const CATEGORY_IMAGES = {
  'Coffee Cupping': 'https://images.unsplash.com/photo-1558996260-4bac67dbd110',
  'Creative Talks': 'https://images.unsplash.com/photo-1601893211509-81b6d03e46a0',
  'Open Mic Night': 'https://images.unsplash.com/flagged/photo-1582318734861-7e90a4a6c62c',
  'Startup Meetups': 'https://images.unsplash.com/photo-1549045345-058277380fc3',
  'Acoustic Night': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7'
};

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [registrationRecord, setRegistrationRecord] = useState(null);

  const fetchEventData = async () => {
    try {
      const record = await pb.collection('events').getOne(eventId, { $autoCancel: false });
      setEvent(record);

      if (currentUser) {
        // Check if registered
        const regRecords = await pb.collection('eventRegistrations').getList(1, 1, {
          filter: `eventId="${eventId}" && userId="${currentUser.id}"`,
          $autoCancel: false
        });
        if (regRecords.items.length > 0) {
          setRegistrationRecord(regRecords.items[0]);
        } else {
          setRegistrationRecord(null);
        }

        // Check if saved
        const savedRecords = await pb.collection('savedEvents').getList(1, 1, {
          filter: `eventId="${eventId}" && userId="${currentUser.id}"`,
          $autoCancel: false
        });
        setIsSaved(savedRecords.items.length > 0);
      }
    } catch (err) {
      console.error("Error fetching event:", err);
      setError("Event not found or unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId, currentUser]);

  const handleRegister = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: `/community/events/${eventId}` } } });
      return;
    }

    setIsRegistering(true);
    try {
      // Create registration record
      await pb.collection('eventRegistrations').create({
        eventId: event.id,
        userId: currentUser.id
      }, { $autoCancel: false });

      // Update event registeredUsers array (for quick counting)
      const currentUsers = event.registeredUsers || [];
      if (!currentUsers.includes(currentUser.id)) {
        await pb.collection('events').update(event.id, {
          registeredUsers: [...currentUsers, currentUser.id]
        }, { $autoCancel: false });
      }

      await fetchEventData(); // Refresh state
    } catch (err) {
      console.error("Registration failed:", err);
      alert("Failed to register. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!registrationRecord) return;
    
    setIsRegistering(true);
    try {
      // Delete registration record
      await pb.collection('eventRegistrations').delete(registrationRecord.id, { $autoCancel: false });

      // Remove from event array
      const currentUsers = event.registeredUsers || [];
      const updatedUsers = currentUsers.filter(id => id !== currentUser.id);
      await pb.collection('events').update(event.id, {
        registeredUsers: updatedUsers
      }, { $autoCancel: false });

      await fetchEventData();
    } catch (err) {
      console.error("Unregister failed:", err);
      alert("Failed to unregister.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        // Find and delete saved record
        const savedRecords = await pb.collection('savedEvents').getList(1, 1, {
          filter: `eventId="${eventId}" && userId="${currentUser.id}"`,
          $autoCancel: false
        });
        if (savedRecords.items.length > 0) {
          await pb.collection('savedEvents').delete(savedRecords.items[0].id, { $autoCancel: false });
        }
        setIsSaved(false);
      } else {
        // Create saved record
        await pb.collection('savedEvents').create({
          eventId: event.id,
          userId: currentUser.id
        }, { $autoCancel: false });
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Save toggle failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  
  if (error || !event) return (
    <div className="min-h-screen bg-background py-20 text-center">
      <AlertCircle size={48} className="mx-auto text-destructive mb-4" />
      <h2 className="text-2xl font-bold text-foreground mb-4">{error}</h2>
      <button onClick={() => navigate('/community/events')} className="text-primary hover:underline">Back to Events</button>
    </div>
  );

  const registeredCount = event.registeredUsers ? event.registeredUsers.length : 0;
  const isFull = registeredCount >= event.capacity;
  const isRegistered = !!registrationRecord;
  const imageUrl = event.image ? pb.files.getUrl(event, event.image) : (CATEGORY_IMAGES[event.category] || CATEGORY_IMAGES['Coffee Cupping']);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>{event.title} | Unfoold Events</title>
      </Helmet>

      {/* Hero Image */}
      <div className="w-full h-[40vh] md:h-[50vh] relative">
        <img src={imageUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <BreadcrumbNav items={[
          { label: 'Community', path: '/community/events' },
          { label: 'Events', path: '/community/events' },
          { label: event.title, path: `/community/events/${event.id}` }
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card rounded-2xl p-8 border border-border shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/30">
                  {event.category || 'Event'}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">{event.title}</h1>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border shadow-xl">
              <h3 className="text-xl font-bold text-foreground mb-6">About the Organizer</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-primary border border-border">
                  <User size={24} />
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">{event.organizer || 'Unfoold Team'}</p>
                  <p className="text-muted-foreground">Community Host</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-6 border border-border shadow-xl sticky top-24">
              <h3 className="text-lg font-bold text-foreground mb-6 border-b border-border pb-4">Event Details</h3>
              
              <div className="space-y-5 mb-8">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary rounded-lg text-primary"><Calendar size={20} /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium text-foreground">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary rounded-lg text-primary"><Clock size={20} /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium text-foreground">{event.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary rounded-lg text-primary"><MapPin size={20} /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium text-foreground">Unfoold Main Space</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary rounded-lg text-primary"><Users size={20} /></div>
                  <div className="w-full">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-muted-foreground">Availability</p>
                      <p className="text-sm font-medium text-foreground">{registeredCount} / {event.capacity}</p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${isFull ? 'bg-destructive' : 'bg-primary'}`} 
                        style={{ width: `${Math.min(100, (registeredCount / event.capacity) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {isRegistered ? (
                  <div className="space-y-3">
                    <div className="w-full py-3 bg-green-500/10 border border-green-500/30 text-green-500 rounded-xl font-bold flex items-center justify-center gap-2">
                      <CheckCircle size={20} /> You're Registered!
                    </div>
                    <button 
                      onClick={handleUnregister}
                      disabled={isRegistering}
                      className="w-full py-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
                    >
                      {isRegistering ? 'Processing...' : 'Cancel Registration'}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleRegister}
                    disabled={isFull || isRegistering}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                      isFull 
                        ? 'bg-secondary text-muted-foreground cursor-not-allowed' 
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] shadow-lg shadow-primary/20'
                    }`}
                  >
                    {isRegistering ? 'Processing...' : isFull ? 'Event Sold Out' : 'Register for Event'}
                  </button>
                )}

                <button 
                  onClick={handleSaveEvent}
                  disabled={isSaving}
                  className={`w-full py-3 rounded-xl font-medium border transition-colors flex items-center justify-center gap-2 ${
                    isSaved 
                      ? 'bg-secondary border-primary text-primary' 
                      : 'bg-transparent border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  <Bookmark size={18} className={isSaved ? 'fill-current' : ''} /> 
                  {isSaved ? 'Saved to Favorites' : 'Save Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;