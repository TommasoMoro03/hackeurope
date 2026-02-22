// Experiment entry point: resolves segment and renders appropriate variant.
// Drop-in replacement wrapper around the signin button area.
import React, { useMemo } from 'react';
import { resolveSegment } from './segmentUtils';
import SigninButtonVariantA from './SigninButtonVariantA';
import SigninButtonVariantB from './SigninButtonVariantB';

interface Props {
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const ExperimentSigninButton: React.FC<Props> = ({ onClick, className, children }) => {
  // Resolve segment once per component mount (memoized)
  const segment = useMemo(() => resolveSegment(), []);

  if (segment.id === 22) {
    return (
      <SigninButtonVariantB segment={segment} onClick={onClick} className={className}>
        {children}
      </SigninButtonVariantB>
    );
  }

  // Default: Segment A (baseline)
  return (
    <SigninButtonVariantA segment={segment} onClick={onClick} className={className}>
      {children}
    </SigninButtonVariantA>
  );
};

export default ExperimentSigninButton;
