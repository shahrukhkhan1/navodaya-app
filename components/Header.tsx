import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-4 px-4 text-center border-b border-gray-700">
      <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400">
        🧠 नवोदय मित्र - आपकी तैयारी का साथी
      </h1>
      <p className="text-sm text-gray-400 mt-1">कोई भी प्रश्न अपलोड करें और चलिए उसे साथ मिलकर, कदम-दर-कदम हल करें!</p>
    </header>
  );
};

export default Header;
