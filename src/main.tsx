import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

const environmentId = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DynamicContextProvider
        settings={{
          environmentId: environmentId || 'REPLACE_WITH_DYNAMIC_ENV_ID',
          walletConnectors: [EthereumWalletConnectors],
        }}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </DynamicContextProvider>
    </QueryClientProvider>
  </StrictMode>,
);
