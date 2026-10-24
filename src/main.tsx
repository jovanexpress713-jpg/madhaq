import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { installProductionGuard } from './services/productionGuard';
import { installPurchaseGuard } from './services/purchaseGuard';
import './index.css';

installProductionGuard();
installPurchaseGuard();

createRoot(document.getElementById('root')!).render(<App />);
