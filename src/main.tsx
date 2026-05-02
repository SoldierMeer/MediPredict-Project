import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UserProvider } from './context/UserContext';
import { MedicationProvider } from './context/MedicationContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <MedicationProvider>
        <App />
      </MedicationProvider>
    </UserProvider>
  </StrictMode>,
);
