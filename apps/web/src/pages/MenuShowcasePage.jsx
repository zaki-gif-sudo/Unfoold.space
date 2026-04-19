import React, { useState, useEffect } from 'react';
import { Heart, Share2, ChefHat, Utensils, Clock, MapPin } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';

const MenuShowcasePage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const items = await pb.collection('menu_items').getFullList({
        sort: '-created',
      });
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'appetizers', 'main', 'desserts', 'beverages', 'special'];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (itemId) => {
    setFavorites(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const shareItem = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: `Check out ${item.name} from Unfoold Espresso!`,
        url: window.location.href
      });
    } else {
      alert(`Share: ${item.name}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <ChefHat className="w-16 h-16 mx-auto text-amber-600 animate-bounce" />
          <p className="text-gray-600">Preparing menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-800 to-amber-900 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 text-6xl">☕</div>
          <div className="absolute bottom-5 left-10 text-5xl">🍰</div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <ChefHat className="w-8 h-8" />
            <h1 className="text-4xl md:text-5xl font-bold">Unfoold Espresso</h1>
          </div>
          <p className="text-orange-100 text-lg mb-4">Culinary Delights & Artisan Coffee Experience</p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-md">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{menuItems.length}</div>
              <div className="text-sm text-orange-100">Dishes</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">⭐5.0</div>
              <div className="text-sm text-orange-100">Rating</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <Clock className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm text-orange-100">Open</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
          />
          
          {/* Category Filter */}
          <div className="flex overflow-x-auto gap-2 pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? '🍽️ All' : 
                 cat === 'appetizers' ? '🥗 Starters' :
                 cat === 'main' ? '🍝 Main' :
                 cat === 'desserts' ? '🍰 Desserts' :
                 cat === 'beverages' ? '☕ Drinks' :
                 '⭐ Special'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="container mx-auto px-4 py-12">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Utensils className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No dishes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-300"
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-orange-100 to-amber-100 overflow-hidden">
                  {item.image ? (
                    <img
                      src={pb.getFileUrl(item, item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-orange-200">
                      {item.emoji || '🍽️'}
                    </div>
                  )}
                  
                  {/* Price Badge */}
                  <div className="absolute top-3 right-3 bg-orange-600 text-white px-3 py-1 rounded-full font-bold shadow-lg">
                    Rp {item.price?.toLocaleString('id-ID')}
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="absolute top-3 left-3 bg-white/90 hover:bg-white rounded-full p-2 transition-all"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favorites[item.id]
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                  
                  {item.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                  )}

                  {/* Details */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.cookingTime && (
                      <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        {item.cookingTime} min
                      </span>
                    )}
                    {item.spicy && (
                      <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">
                        🌶️ Spicy
                      </span>
                    )}
                    {item.vegetarian && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                        🥬 Vegetarian
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => shareItem(item)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-medium transition-all"
                    >
                      Learn More
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-orange-50 border-t border-orange-200 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <MapPin className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900">Visit Us</h4>
                <p className="text-gray-600 text-sm">Instagram @unfoold.espresso</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900">Open Hours</h4>
                <p className="text-gray-600 text-sm">Daily 09:00 AM - 10:00 PM</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Utensils className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900">Experience</h4>
                <p className="text-gray-600 text-sm">Premium Espresso & Cuisine</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuShowcasePage;
