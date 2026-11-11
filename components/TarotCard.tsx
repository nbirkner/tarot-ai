'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { DrawnCard } from '../lib/types';
import { GeometricFace } from './GeometricFace';

interface TarotCardProps {
  drawn: DrawnCard;
  isFlipped?: boolean;
  isFlippable?: boolean;
  isRevealed?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showPosition?: boolean;
  tilt?: number;
}

function variantFor(name: string): 0 | 1 | 2 {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return (sum % 3) as 0 | 1 | 2;
}

export function TarotCard({
  drawn,
  isFlipped,
  isFlippable,
  onClick,
  size = 'md',
  showPosition = true,
  tilt = 0,
}: TarotCardProps) {
  const reduce = useReducedMotion();
  const [artFailed, setArtFailed] = useState(false);
  const canFlip = Boolean(isFlippable && !isFlipped && onClick);
  const variant = variantFor(drawn.card.name);
  const hasArt = Boolean(drawn.imageUrl && drawn.imageUrl !== 'failed' && !artFailed);

  useEffect(() => {
    setArtFailed(false);
  }, [drawn.imageUrl]);

  const face = (
    <div className="oracle-shell" data-size={size}>
      <motion.div
        className="oracle-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 18 }}
      >
        <div className="face back">
          <GeometricFace variant={variant} />
        </div>
        <div className="face front">
          {hasArt ? (
            <div className={drawn.reversed ? 'art-frame is-reversed' : 'art-frame'}>
              <Image
                src={drawn.imageUrl as string}
                alt={drawn.card.name}
                width={520}
                height={780}
                className="card-photo"
                onError={() => setArtFailed(true)}
              />
            </div>
          ) : drawn.imageUrl === 'failed' || artFailed ? (
            <div className="card-fallback" role="img" aria-label={`${drawn.card.name} art unavailable`}>
              <GeometricFace variant={variant} />
              <span className="name">{drawn.card.name}</span>
            </div>
          ) : (
            <div className="drawing" aria-hidden="true">
              <GeometricFace variant={(variant + 1) % 3 as 0 | 1 | 2} />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  const label = `Turn over ${drawn.card.name}${drawn.reversed ? ', reversed' : ''}${
    drawn.position ? `, ${drawn.position}` : ''
  }`;

  return (
    <motion.div
      className="deal"
      initial={reduce ? false : { opacity: 0, y: 28, rotate: tilt - 8 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      whileHover={reduce || !canFlip ? undefined : { y: -8, rotate: tilt - 1.5 }}
      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 20 }}
    >
      {canFlip ? (
        <button type="button" className="oracle-hit" onClick={onClick} aria-label={label}>
          {face}
        </button>
      ) : (
        <div className="oracle-hit">{face}</div>
      )}

      {isFlipped && showPosition ? (
        <div className="card-caption">
          <p className="card-name">{drawn.card.name}</p>
          {drawn.position && <p className="mono-label">{drawn.position}</p>}
          {drawn.reversed && <p className="mono-label">Reversed</p>}
        </div>
      ) : null}

      {canFlip && <p className="mono-label">Turn Over</p>}
    </motion.div>
  );
}
