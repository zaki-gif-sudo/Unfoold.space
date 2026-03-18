import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, MapPin, Phone, Mail } from 'lucide-react';

const LOGO_URL = "https://horizons-cdn.hostinger.com/13222a4f-1f4e-4729-8f8a-40893789af3d/381d04386012875b31d158921a226cdb.png";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-3 text-foreground">
              <img src={LOGO_URL} alt="Unfoold Espresso Logo" className="h-12 w-auto object-contain dark:invert" loading="lazy" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Coffee. Conversation. Culture. A premium social space designed for connection and exceptional espresso experiences.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Facebook size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/menu" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Our Menu</Link></li>
              <li><Link to="/join-social" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Join the Social</Link></li>
              <li><Link to="/community" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Community Events</Link></li>
              <li><Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors text-sm">My Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-sm text-muted-foreground">
                <MapPin size={18} className="text-foreground shrink-0 mt-0.5" />
                <span>123 Espresso Ave, Coffee District<br/>Cityville, ST 12345</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Phone size={18} className="text-foreground shrink-0" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Mail size={18} className="text-foreground shrink-0" />
                <span>hello@unfoold.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-foreground mb-4">Hours</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex justify-between"><span>Mon - Fri</span><span className="font-medium text-foreground">7:00 AM - 8:00 PM</span></li>
              <li className="flex justify-between"><span>Saturday</span><span className="font-medium text-foreground">8:00 AM - 9:00 PM</span></li>
              <li className="flex justify-between"><span>Sunday</span><span className="font-medium text-foreground">8:00 AM - 6:00 PM</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Unfoold Espresso Social Space. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;