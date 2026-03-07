import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AgriCard = ({ 
  children, 
  className = '', 
  style = {}, 
  animate = true,
  hover = true,
  padding = '24px',
  borderRadius = '24px',
  ...props
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const shouldAnimate = animate && !isMobile;
  const shouldHover = hover && !isMobile;
  const content = (
    <div 
      className={`agri-card ${className}`}
      style={{
        padding,
        borderRadius,
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );

  if (!shouldAnimate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={shouldHover ? { y: -4 } : {}}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      style={{ height: '100%' }}
    >
      {content}
    </motion.div>
  );
};

export default AgriCard;
