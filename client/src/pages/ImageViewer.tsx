import { useState, useEffect } from 'react';

export default function ImageViewer() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Function to fetch and convert the image to a data URL
    const fetchImage = async () => {
      try {
        const response = await fetch('/attached_assets/sonata.jpeg');
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (error) {
        console.error('Error loading image:', error);
      }
    };

    fetchImage();

    // Clean up the object URL on unmount
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-light mb-6">Sonata Logo Viewer</h1>
      {imageUrl ? (
        <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-md">
          <img
            src={imageUrl}
            alt="Sonata Logo"
            className="max-w-full"
            style={{ maxHeight: '400px' }}
          />
        </div>
      ) : (
        <div className="animate-pulse bg-slate-200 rounded-xl" style={{ width: '300px', height: '200px' }}></div>
      )}
    </div>
  );
}