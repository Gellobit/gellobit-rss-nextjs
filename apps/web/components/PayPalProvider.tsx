'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { ReactNode } from 'react';

interface PayPalProviderProps {
  clientId: string;
  children: ReactNode;
}

export default function PayPalProvider({ clientId, children }: PayPalProviderProps) {
  if (!clientId) {
    console.warn('PayPal Client ID not provided');
    return <>{children}</>;
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        vault: true,
        intent: 'subscription',
        components: 'buttons',
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}
