'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Button, Stack, Text, Input } from '@chakra-ui/react';
import { FaIdCard } from 'react-icons/fa';
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
import { Product } from '../types';

interface RFIDInputDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSubmit: (rfid: string, product: Product) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function RFIDInputDialog({
  open,
  onClose,
  product,
  onSubmit,
  isLoading = false,
  error = null,
}: RFIDInputDialogProps) {
  const [rfid, setRfid] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setRfid('');
      // Focus input after a short delay to ensure dialog is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rfid.trim() && product && !isLoading) {
      onSubmit(rfid.trim(), product);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && rfid.trim() && product && !isLoading) {
      handleSubmit(e);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(e) => !e.open && onClose()} size="md">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>RFID Payment</DialogTitle>
          <DialogDescription>
            Enter your RFID number to pay for {product?.name}
          </DialogDescription>
        </DialogHeader>

        <DialogCloseTrigger />

        <DialogBody>
          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Box>
                <Stack gap={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <FaIdCard size={20} />
                    <Text fontWeight="medium">RFID Number</Text>
                  </Box>
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Enter your RFID number"
                    value={rfid}
                    onChange={(e) => setRfid(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    size="lg"
                    maxLength={10}
                  />
                  {error && (
                    <Text color="fg.error" fontSize="sm">
                      {error}
                    </Text>
                  )}
                  <Text fontSize="sm" color="fg.muted">
                    Press Enter to continue
                  </Text>
                </Stack>
              </Box>

              {product && (
                <Box bg="bg.subtle" p={4} borderRadius="md">
                  <Stack gap={2}>
                    <Text fontSize="sm" color="fg.muted">
                      Product
                    </Text>
                    <Text fontWeight="semibold">{product.name}</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="colorPalette.600">
                      ₱{product.price.toFixed(2)}
                    </Text>
                  </Stack>
                </Box>
              )}
            </Stack>
          </form>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            colorPalette="green"
            onClick={handleSubmit}
            loading={isLoading}
            disabled={!rfid.trim() || isLoading}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
