import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

console.log('MAIN.TSX: 1. Imports done');

// Ensure root exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('MAIN.TSX: Root element MISSING');
  throw new Error('Failed to find the root element');
}
console.log('MAIN.TSX: 2. Root found');

try {
  const root = createRoot(rootElement);
  console.log('MAIN.TSX: 3. Root created. Rendering...');

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('MAIN.TSX: 4. Render scheduled');
} catch (err) {
  console.error('MAIN.TSX: CRASH during render setup', err);
}
