import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { installProductionGuard } from './services/productionGuard';
import { installPurchaseGuard } from './services/purchaseGuard';
import { installReturnGuard } from './services/returnGuard';
import { installSupplierGuard } from './services/supplierGuard';
import './index.css';

installProductionGuard();
installPurchaseGuard();
installReturnGuard();
installSupplierGuard();

createRoot(document.getElementById('root')!).render(<App />);
