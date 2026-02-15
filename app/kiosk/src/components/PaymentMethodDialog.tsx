'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Stack, Text } from '@chakra-ui/react';
import { FaCreditCard, FaIdCard } from 'react-icons/fa';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogCloseTrigger,
} from '@svm/components/dialog';
import { Skeleton } from '@svm/components/skeleton';
import { EmptyState } from '@svm/components/empty-state';
import { Product, PaymentMethod } from '../types';
import { fetchPaymentMethods } from '../lib/api';

interface PaymentMethodDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onPaymentSelect: (paymentMethod: PaymentMethod, product: Product) => void;
}

export function PaymentMethodDialog({
  open,
  onClose,
  product,
  onPaymentSelect,
}: PaymentMethodDialogProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadPaymentMethods();
    }
  }, [open]);

  async function loadPaymentMethods() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchPaymentMethods();
      setPaymentMethods(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  }

  const handlePaymentMethodSelect = (paymentMethod: PaymentMethod) => {
    if (product) {
      onPaymentSelect(paymentMethod, product);
      onClose();
    }
  };

  const getPaymentIcon = (methodName: string) => {
    const name = methodName.toLowerCase();
    if (name.includes('rfid')) {
      return <FaIdCard size={24} />;
    }
    if (name.includes('wallet') || name.includes('e-wallet')) {
      return <FaCreditCard size={24} />;
    }
    return <FaCreditCard size={24} />;
  };

  return (
    <DialogRoot open={open} onOpenChange={(e) => !e.open && onClose()} size="md">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Payment Method</DialogTitle>
          <DialogDescription>
            Choose how you want to pay for {product?.name}
          </DialogDescription>
        </DialogHeader>

        <DialogCloseTrigger />

        <DialogBody>
          {isLoading ? (
            <Stack gap={3}>
              <Skeleton height="16" />
              <Skeleton height="16" />
            </Stack>
          ) : error ? (
            <EmptyState title="Error loading payment methods" description={error} />
          ) : (
            <Stack gap={3}>
              {paymentMethods.map((method) => (
                <Button
                  key={method.id}
                  size="xl"
                  variant="outline"
                  colorPalette="blue"
                  onClick={() => handlePaymentMethodSelect(method)}
                  height="auto"
                  py={6}
                >
                  <Box display="flex" alignItems="center" gap={4} width="100%">
                    <Box color="blue.600">{getPaymentIcon(method.name)}</Box>
                    <Box flex={1} textAlign="left">
                      <Text fontSize="lg" fontWeight="bold">
                        {method.name}
                      </Text>
                    </Box>
                  </Box>
                </Button>
              ))}
            </Stack>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
