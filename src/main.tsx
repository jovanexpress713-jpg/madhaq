import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { MadhaqEntryFlow } from './components/MadhaqEntryFlow';
import { installDistributionGuard } from './services/distributionGuard';
import { installProductionGuard } from './services/productionGuard';
import { installPurchaseGuard } from './services/purchaseGuard';
import { installReturnGuard } from './services/returnGuard';
import { installSupplierGuard } from './services/supplierGuard';
import './index.css';

installDistributionGuard();
installProductionGuard();
installPurchaseGuard();
installReturnGuard();
installSupplierGuard();

createRoot(document.getElementById('root')!).render(
  <MadhaqEntryFlow>
    {() => <App />}
  </MadhaqEntryFlow>,
);
