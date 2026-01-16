'use client';

import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Loader2 } from 'lucide-react';

interface PayPalSubscribeButtonProps {
  planId: string;
  onSuccess: (subscriptionId: string) => void;
  onError: (error: Error) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export default function PayPalSubscribeButton({
  planId,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
}: PayPalSubscribeButtonProps) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Loading PayPal...</span>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="text-center py-4 text-red-600 text-sm">
        Failed to load PayPal. Please refresh the page.
      </div>
    );
  }

  return (
    <PayPalButtons
      style={{
        layout: 'vertical',
        label: 'subscribe',
        shape: 'rect',
        color: 'gold',
      }}
      disabled={disabled}
      createSubscription={(data, actions) => {
        return actions.subscription.create({
          plan_id: planId,
        });
      }}
      onApprove={async (data) => {
        if (data.subscriptionID) {
          onSuccess(data.subscriptionID);
        } else {
          onError(new Error('No subscription ID received'));
        }
      }}
      onError={(err) => {
        console.error('PayPal Error:', err);
        onError(err instanceof Error ? err : new Error('PayPal subscription failed'));
      }}
      onCancel={() => {
        if (onCancel) {
          onCancel();
        }
      }}
    />
  );
}
