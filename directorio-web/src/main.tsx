import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

// Home-screen apps on iOS may remain running after a new Vercel release.
// Compare the entry bundle only when returning to the app, and reload if
// the server is serving a newer build. Never cache HTML or API responses.
function watchForNewVersion() {
  const currentBundle = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')?.getAttribute('src');
  if (!currentBundle) return;
  let checking = false;
  let lastCheck = Date.now();
  async function check() {
    if (document.visibilityState !== 'visible' || checking || Date.now() - lastCheck < 60_000) return;
    checking = true;
    lastCheck = Date.now();
    try {
      const response = await fetch('/?version_check=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) return;
      const html = await response.text();
      const match = html.match(/<script[^>]*src="([^"]*\/assets\/[^"]+\.js)"[^>]*>/i);
      if (match?.[1] && match[1] !== currentBundle) window.location.reload();
    } catch {
      // Offline? Keep the existing app usable until connectivity returns.
    } finally {
      checking = false;
    }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void check(); });
  window.addEventListener('focus', () => void check());
}
watchForNewVersion();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>
);
