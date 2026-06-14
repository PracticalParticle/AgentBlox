import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import App from './App';
import { getDynamicEnvironmentId, isDynamicEnvironmentConfigured } from './lib/dynamic-config';
import './index.css';

const queryClient = new QueryClient();
const environmentId = getDynamicEnvironmentId();
const dynamicConfigured = isDynamicEnvironmentConfigured();

function AppTree() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {dynamicConfigured ? (
        <DynamicContextProvider
          settings={{
            environmentId,
            walletConnectors: [EthereumWalletConnectors],
            appName: 'AgentBlox',
            logLevel: import.meta.env.DEV ? 'WARN' : 'ERROR',
          }}
        >
          <AppTree />
        </DynamicContextProvider>
      ) : (
        <AppTree />
      )}
    </QueryClientProvider>
  </StrictMode>,
);
