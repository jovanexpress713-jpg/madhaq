import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { storage } from './services/storage';
import { installDistributionGuard } from './services/distributionGuard';
import { installProductionGuard } from './services/productionGuard';
import { installPurchaseGuard } from './services/purchaseGuard';
import { installReturnGuard } from './services/returnGuard';
import { installSupplierGuard } from './services/supplierGuard';
import { installRecoveryBackup } from './services/recoveryBackup';
import { installRecoveryCommitBridge } from './services/recoveryCommitBridge';
import { installDocumentNumberIntegrity } from './services/documentNumberIntegrity';
import './index.css';

installDistributionGuard();
installProductionGuard();
installPurchaseGuard();
installReturnGuard();
installSupplierGuard();
installRecoveryBackup();
installRecoveryCommitBridge(storage.subscribe.bind(storage));
installDocumentNumberIntegrity();

createRoot(document.getElementById('root')!).render(<App />);
