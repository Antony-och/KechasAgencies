import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { DemoPortalProvider } from './contexts/DemoPortalContext.tsx';
import { SiteDataProvider } from './contexts/SiteDataContext.tsx';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AuthProvider>
      <DemoPortalProvider>
        <SiteDataProvider>
          <App />
        </SiteDataProvider>
      </DemoPortalProvider>
    </AuthProvider>
  </ErrorBoundary>
);
