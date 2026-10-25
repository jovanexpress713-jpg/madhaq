import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { installDistributionGuard } from './services/distributionGuard';
import { installProductionGuard } from './services/productionGuard';
import { installPurchaseGuard } from './services/purchaseGuard';
import { installReturnGuard } from './services/returnGuard';
import { installSupplierGuard } from './services/supplierGuard';
import { installRecoveryBackup } from './services/recoveryBackup';
import { installDocumentNumberIntegrity } from './services/documentNumberIntegrity';
import './index.css';

installDistributionGuard();
installProductionGuard();
installPurchaseGuard();
installReturnGuard();
installSupplierGuard();
installRecoveryBackup();
installDocumentNumberIntegrity();

createRoot(document.getElementById('root')!).render(<App />);
