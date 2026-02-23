// Segment B: Change the color of the signin button.
import React, { useEffect } from 'react';
import { Segment, trackEvent } from './segmentUtils';

interface Props {
  segment: Segment;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const SigninButtonVariantB: React.FC<Props> = ({ segment, onClick, className, children }) => {
  useEffect(() => {
    trackEvent('button_view', segment);
  }, [segment]);

  const handleClick = () => {
    trackEvent('button_click', segment);
    if (onClick) onClick();
  };

  // Variant B: changed button color (purple/violet instead of default)
  const variantStyle: React.CSSProperties = {
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    border: '2px solid #6d28d9',
    borderRadius: '8px',
    padding: '10px 24px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s ease',
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      style={variantStyle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6d28d9';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#7c3aed';
      }}
    >
      {children ?? 'Sign in with Google'}
    </button>
  );
};

export default SigninButtonVariantB;
