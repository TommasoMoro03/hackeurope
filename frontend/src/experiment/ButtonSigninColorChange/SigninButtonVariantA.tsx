// Segment A: Baseline - Keep original layout. No changes.
import React, { useEffect } from 'react';
import { Segment, trackEvent } from './segmentUtils';

interface Props {
  segment: Segment;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const SigninButtonVariantA: React.FC<Props> = ({ segment, onClick, className, children }) => {
  useEffect(() => {
    trackEvent('button_view', segment);
  }, [segment]);

  const handleClick = () => {
    trackEvent('button_click', segment);
    if (onClick) onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      style={{
        // Baseline: no style changes
        background: undefined,
        border: undefined,
      }}
    >
      {children ?? 'Sign in with Google'}
    </button>
  );
};

export default SigninButtonVariantA;
