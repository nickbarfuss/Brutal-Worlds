
import React from 'react';

interface ProductInfoProps {
  className?: string;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ className }) => {
  return (
    <div className={`flex flex-col items-center ${className || ''}`}>
        <h1 
            className="font-dungeon text-8xl font-bold text-white uppercase tracking-wider"
            style={{ textShadow: '4px 4px 16px rgba(0,0,0,0.4)', lineHeight: '1.0' }}
        >
            Brutal Worlds
        </h1>
    </div>
  );
};

export default ProductInfo;