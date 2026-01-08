import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';



// Ensure root exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('MAIN.TSX: Root element MISSING');
  throw new Error('Failed to find the root element');
}


try {
  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (err) {
  console.error('MAIN.TSX: CRASH during render setup', err);
}
