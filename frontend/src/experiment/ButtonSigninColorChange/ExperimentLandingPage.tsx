// Standalone landing page for the experiment at route /experiment/button-signin-color-change
// Allows previewing both variants via ?x=HASH and testing normal random assignment
import React, { useMemo } from 'react';
import { resolveSegment, SEGMENTS, EXPERIMENT_ID } from './segmentUtils';
import SigninButtonVariantA from './SigninButtonVariantA';
import SigninButtonVariantB from './SigninButtonVariantB';

const ExperimentLandingPage: React.FC = () => {
  const segment = useMemo(() => resolveSegment(), []);

  const handleGoogleSignin = () => {
    // In real usage this would trigger the actual Google OAuth flow
    console.log(`[Exp ${EXPERIMENT_ID}] Signin button clicked - Segment ${segment.name} (id: ${segment.id})`);
  };

  const renderButton = () => {
    if (segment.id === 22) {
      return (
        <SigninButtonVariantB segment={segment} onClick={handleGoogleSignin}>
          Sign in with Google
        </SigninButtonVariantB>
      );
    }
    return (
      <SigninButtonVariantA segment={segment} onClick={handleGoogleSignin}>
        Sign in with Google
      </SigninButtonVariantA>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        fontFamily: 'Inter, system-ui, sans-serif',
        gap: '24px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '48px 40px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          minWidth: '320px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>
          Welcome to Pryo
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '15px', textAlign: 'center' }}>
          Sign in to manage your A/B experiments
        </p>

        {renderButton()}

        <p
          style={{
            margin: 0,
            fontSize: '11px',
            color: '#9ca3af',
            textAlign: 'center',
          }}
        >
          Experiment: Button Sign-in Color Change &mdash; Segment {segment.name}
        </p>
      </div>

      {/* Preview links for QA */}
      <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#6b7280' }}>
        {SEGMENTS.map((s) => (
          <a
            key={s.id}
            href={`?x=${s.preview_hash}`}
            style={{ color: '#7c3aed', textDecoration: 'underline' }}
          >
            Preview Segment {s.name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default ExperimentLandingPage;
