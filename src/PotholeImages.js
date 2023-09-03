import React from 'react';

const PotholeImages = ({ images }) => {
  return (
    <div className="pothole-images">
      {images.map((image, index) => (
        <img key={index} src={image} alt={`Pothole ${index + 1}`} />
      ))}
    </div>
  );
};

export default PotholeImages;