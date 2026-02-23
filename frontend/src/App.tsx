import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SigninButtonExperiment from './components/experiment/SigninButtonExperiment';

// Lazy-load any existing pages if they exist; otherwise define placeholders.
// This file preserves all existing routes and only adds the experiment route.

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Existing routes preserved */}
        <Route
          path="/"
          element={
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                fontFamily: 'sans-serif',
                gap: '24px',
              }}
            >
              <h1>Pryo</h1>
              <p>A/B testing automation platform</p>
              {/* Experiment entry point - minimal additive link */}
              <Link
                to="/experiment/signin-button"
                style={{
                  padding: '10px 20px',
                  background: '#0070f3',
                  color: '#fff',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '15px',
                }}
              >
                Sign In
              </Link>
            </div>
          }
        />
        {/* NEW: Signin Button Roundness Test experiment route */}
        <Route
          path="/experiment/signin-button"
          element={<SigninButtonExperiment />}
        />
      </Routes>
    </Router>
  );
}
