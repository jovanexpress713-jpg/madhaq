import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { installProductionGuard } from './services/productionGuard';
import './index.css';

installProductionGuard();

createRoot(document.getElementById('root')!).render(<App />);
