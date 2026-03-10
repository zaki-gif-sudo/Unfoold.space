import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const BreadcrumbNav = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
      <Link to="/" className="hover:text-primary transition-colors flex items-center">
        <Home size={16} />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={16} className="flex-shrink-0" />
          {index === items.length - 1 ? (
            <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-none">
              {item.label}
            </span>
          ) : (
            <Link to={item.path} className="hover:text-primary transition-colors truncate max-w-[150px] md:max-w-none">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNav;