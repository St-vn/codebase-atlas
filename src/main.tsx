import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import httpx from '../fixtures/httpx.graph.json';
import 'reactflow/dist/style.css';

// MVP: loads the bundled httpx fixture so `npm run dev` shows a real graph.
// Later: replace with a repo picker that runs GraphifyRunner to produce graph.json.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialGraph={httpx} />
  </StrictMode>,
);
