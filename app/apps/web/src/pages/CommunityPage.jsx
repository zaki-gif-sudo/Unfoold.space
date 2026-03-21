import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';

const CommunityPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchEvents = async () => {
    try {
      const records = await pb.collection('events').getList(1, 50, {
        sort: 'date',
        $autoCancel: false
      });
      setEvents(records.items);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegister = async (event) => {
    if (!currentUser) {
      alert("Please log in to register for events.");
      return;
    }

    const currentUsers = event.registeredUsers || [];
    if (currentUsers.includes(currentUser.id)) {
      alert("You are already registered for this event.");
      return;
    }

    if (currentUsers.length >= event.capacity) {
      alert("Sorry, this event is full.");
      return;
    }

    try {
      const updatedUsers = [...currentUsers, currentUser.id];
      await pb.collection('events').update(event.id, {
        registeredUsers: updatedUsers
      }, { $autoCancel: false });
      
      alert("Successfully registered!");
      fetchEvents(); // Refresh list
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Failed to register. The event might be restricted.");
    }
  };

  const isRegistered = (event) => {
    return currentUser && event.registeredUsers && event.registeredUsers.includes(currentUser.id);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <Helmet>
        <title>Community Events | Unfoold Espresso</title>
      </Helmet>

      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Unfoold Community</h1>
          <p className="text-lg text-muted-foreground">
            Join us for workshops, tastings, and gatherings. Connect with fellow coffee enthusiasts and expand your knowledge in our dedicated social space.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-primary">Loading events...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map(event => {
              const registeredCount = event.registeredUsers ? event.registeredUsers.length : 0;
              const isFull = registeredCount >= event.capacity;
              const userRegistered = isRegistered(event);

              return (
                <div key={event.id} className="bg-card rounded-xl overflow-hidden border border-border shadow-lg flex flex-col">
                  <div className="h-48 bg-secondary relative">
                    {event.image ? (
                      <img src={pb.files.getURL(event, event.image)} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                        <Users size={48} className="opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary border border-primary/30">
                      {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-foreground mb-2">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mb-6 flex-1">{event.description}</p>
                    
                    <div className="space-y-2 mb-6 text-sm text-foreground/80">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-primary" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary" />
                        <span>Unfoold Main Space</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <span>{registeredCount} / {event.capacity} Registered</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRegister(event)}
                      disabled={isFull || userRegistered}
                      className={`w-full py-3 rounded-md font-bold transition-colors ${
                        userRegistered 
                          ? 'bg-green-500/20 text-green-500 border border-green-500/50 cursor-default'
                          : isFull
                            ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {userRegistered ? 'Registered ✓' : isFull ? 'Event Full' : 'Register Now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;