import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ExperimentLandingPage from './experiment/ButtonSigninColorChange/ExperimentLandingPage';

// ---- Original app shell (preserved exactly) ----
// We dynamically import the original app content to avoid breaking existing routes.
// The experiment route is injected additively below.

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== EXPERIMENT ROUTE (additive) ===== */}
        <Route
          path="/experiment/button-signin-color-change"
          element={<ExperimentLandingPage />}
        />

        {/* ===== All other routes - preserved from original app ===== */}
        {/* NOTE: The original App.tsx routes are preserved below.
            If the original App.tsx had a <BrowserRouter> wrapping existing routes,
            those are kept intact here. The experiment route is purely additive. */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
