import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowRight, Coffee, Users, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSocialClick = (e) => {
    e.preventDefault();
    if (user) {
      navigate('/social');
    } else {
      navigate('/signup');
    }
  };
  const featuredDrinks = [
    { name: 'Signature Mocha', image: 'https://images.unsplash.com/photo-1678791160773-c6d13bf417ac', desc: 'Rich espresso with artisanal dark chocolate.' },
    { name: 'Velvet Flat White', image: 'https://images.unsplash.com/photo-1617886336706-f9de52633191', desc: 'Smooth microfoam over a double ristretto.' },
    { name: 'Iced Caramel Macchiato', image: 'https://images.unsplash.com/photo-1702257069675-901da791903c', desc: 'Chilled espresso, vanilla, and caramel drizzle.' },
    { name: 'Pour Over Reserve', image: 'https://images.unsplash.com/photo-1702564696113-943727b933ae', desc: 'Single-origin beans brewed to perfection.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Unfoold Espresso | Coffee. Conversation. Culture.</title>
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1481485779053-c595ddf1dc7e" 
            alt="Specialty coffee bar" 
            className="w-full h-full object-cover grayscale"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/70 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white pb-4 border-b-2 border-white mb-6 tracking-tight uppercase inline-block"
          >
            Unfoold Espresso <br className="md:hidden" /><span className="font-light text-3xl md:text-5xl lg:text-6xl block mt-2">Social Space</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-white/90 mb-10 font-light tracking-wide"
          >
            Coffee. Conversation. Culture.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto"
          >
            <button onClick={handleSocialClick} className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-md hover:bg-gray-200 transition-all hover:scale-105 shadow-lg">
              Join the Social
            </button>
            <Link to="/menu" className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-bold rounded-md border-2 border-white hover:bg-white/10 transition-all hover:scale-105">
              Order Coffee
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Drinks */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Signature Creations</h2>
            <div className="w-24 h-1 bg-foreground mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredDrinks.map((drink, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative rounded-xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img 
                    src={drink.image} 
                    alt={drink.name} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">{drink.name}</h3>
                  <p className="text-sm text-muted-foreground">{drink.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/menu" className="inline-flex items-center space-x-2 text-foreground hover:opacity-70 font-medium transition-opacity">
              <span>View Full Menu</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-24 bg-muted border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">The Unfoold Experience</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                We believe that coffee is more than just a beverage; it's a catalyst for connection. Our space is meticulously designed to foster conversation, creativity, and community. Whether you're seeking a quiet corner to work or a vibrant table to gather with friends, Unfoold provides the perfect backdrop.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-background rounded-lg text-foreground border border-border shadow-sm">
                    <Coffee size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground mb-1">Artisanal Roasts</h4>
                    <p className="text-muted-foreground">Carefully sourced beans roasted to highlight their unique flavor profiles.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-background rounded-lg text-foreground border border-border shadow-sm">
                    <Users size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground mb-1">Community First</h4>
                    <p className="text-muted-foreground">A welcoming environment designed for collaboration and shared moments.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-background rounded-lg text-foreground border border-border shadow-sm">
                    <Star size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground mb-1">Premium Service</h4>
                    <p className="text-muted-foreground">Expert baristas dedicated to crafting your perfect cup every time.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 border-2 border-border rounded-xl transform translate-x-4 translate-y-4"></div>
              <img 
                src="https://images.unsplash.com/photo-1554118811-1e0d58224f24" 
                alt="Cafe interior" 
                className="relative rounded-xl shadow-2xl w-full object-cover aspect-square grayscale"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Community - Social & Events */}
      <section className="py-24 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-16">Join The Culture</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Social Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-xl bg-card border border-border shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Users size={28} className="text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground text-center mb-4">Social Network</h3>
              <p className="text-muted-foreground text-center mb-6">Connect with coffee enthusiasts, share moments, and build your community within our vibrant social space.</p>
              <button onClick={handleSocialClick} className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium">
                {user ? 'Go to Social' : 'Join Social'}
              </button>
            </motion.div>

            {/* Events Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-xl bg-card border border-border shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Star size={28} className="text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground text-center mb-4">Community Events</h3>
              <p className="text-muted-foreground text-center mb-6">Discover our upcoming workshops, tastings, and social gatherings to celebrate coffee culture together.</p>
              <Link to="/events" className="block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium text-center">
                Explore Events
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;