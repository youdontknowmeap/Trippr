import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { Postcard } from './Postcard';
import { db, collection, onSnapshot, query, orderBy, handleFirestoreError, OperationType } from '../firebase';

interface MapViewProps {
  onPostcardClick: (postcard: any) => void;
}

export const MapView = ({ onPostcardClick }: MapViewProps) => {
  const [postcards, setPostcards] = useState<any[]>([]);
  
  // Infinite Canvas Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { damping: 30, stiffness: 200 });
  const springY = useSpring(y, { damping: 30, stiffness: 200 });

  useEffect(() => {
    const q = query(collection(db, 'postcards'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Convert Firestore Timestamp to Date if needed, or handle in component
      }));
      setPostcards(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'postcards');
    });

    return () => unsubscribe();
  }, []);

  const handleDrag = (_: any, info: any) => {
    x.set(x.get() + info.delta.x);
    y.set(y.get() + info.delta.y);
  };

  return (
    <div className="h-screen w-screen bg-[#0f1a14] overflow-hidden relative cursor-grab active:cursor-grabbing">
      {/* Artboard Grid Background */}
      <motion.div
        style={{
          x: springX,
          y: springY,
          backgroundImage: `
            linear-gradient(to right, rgba(74, 222, 128, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(74, 222, 128, 0.1) 1px, transparent 1px),
            linear-gradient(to right, rgba(74, 222, 128, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(74, 222, 128, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
        }}
        className="absolute inset-[-200%] z-0"
      />

      {/* The Tapestry Content */}
      <motion.div
        drag
        dragConstraints={{ left: -2000, right: 2000, top: -2000, bottom: 2000 }}
        onDrag={handleDrag}
        style={{ x: springX, y: springY }}
        className="absolute inset-0 z-10"
      >
        {postcards.map((postcard) => (
          <Postcard
            key={postcard.id}
            postcard={postcard}
            onClick={() => onPostcardClick(postcard)}
          />
        ))}
      </motion.div>

      {/* Overlay Vignette */}
      <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]" />
    </div>
  );
};
