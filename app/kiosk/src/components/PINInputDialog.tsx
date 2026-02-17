'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Stack, Text, SimpleGrid } from '@chakra-ui/react';
import { FaLock, FaBackspace } from 'react-icons/fa';
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
import { PinInput } from '@svm/components/pin-input';
import { Product } from '../types';

interface PINInputDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  rfid: string;
  onSubmit: (pin: string, product: Product) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function PINInputDialog({
  open,
  onClose,
  product,
  rfid,
  onSubmit,
  isLoading = false,
  error = null,
}: PINInputDialogProps) {
  const [pin, setPin] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [randomNumbers, setRandomNumbers] = useState<number[]>([]);

  // Shuffle numbers for security
  const shuffleNumbers = () => {
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers;
  };

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setPin('');
      setResetKey((prev) => prev + 1);
      // Randomize keypad numbers
      setRandomNumbers(shuffleNumbers());
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4 && product && !isLoading) {
      onSubmit(pin, product);
      // Auto-clear after submission for kiosk setup
      setPin('');
      setResetKey((prev) => prev + 1);
      // Randomize keypad numbers
      setRandomNumbers(shuffleNumbers());
    }
  };

  const handlePinComplete = (details: { value: string[] }) => {
    const completedPin = details.value.join('');
    if (completedPin.length === 4 && product && !isLoading) {
      setPin(completedPin);
      // Auto-submit when PIN is complete
      onSubmit(completedPin, product);
      // Auto-clear after submission for kiosk setup
      setTimeout(() => {
        setPin('');
        setResetKey((prev) => prev + 1);
        // Randomize keypad numbers
        setRandomNumbers(shuffleNumbers());
      }, 50);
    }
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 4 && !isLoading) {
      const newPin = pin + num;
      setPin(newPin);
      
      // Auto-submit when 4 digits are entered
      if (newPin.length === 4 && product) {
        setTimeout(() => {
          onSubmit(newPin, product);
          // Auto-clear after submission
          setTimeout(() => {
            setPin('');
            setResetKey((prev) => prev + 1);
            // Randomize keypad numbers
            setRandomNumbers(shuffleNumbers());
          }, 50);
        }, 100);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0 && !isLoading) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!isLoading) {
      setPin('');
      setResetKey((prev) => prev + 1);
      // Randomize keypad numbers on clear
      setRandomNumbers(shuffleNumbers());
    }
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={(e) => !e.open && onClose()}
      size="lg"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>PIN Verification</DialogTitle>
          <DialogDescription>
            Enter your 4-digit PIN to confirm payment
          </DialogDescription>
        </DialogHeader>

        <DialogCloseTrigger />

        <DialogBody>
          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Box>
                <Stack gap={4} align="center">
                  <Box display="flex" alignItems="center" gap={2}>
                    <FaLock size={20} />
                    <Text fontWeight="medium">Enter PIN</Text>
                  </Box>

                  <PinInput
                    key={resetKey}
                    count={4}
                    mask
                    otp
                    type="numeric"
                    disabled={isLoading}
                    value={Array.from({ length: 4 }, (_, i) => pin[i] || '')}
                    onValueComplete={handlePinComplete}
                    onValueChange={(details) => setPin(details.value.join(''))}
                  />

                  {error && (
                    <Text color="fg.error" fontSize="sm">
                      {error}
                    </Text>
                  )}
                  <Text fontSize="sm" color="fg.muted" textAlign="center">
                    Use the keypad below or tap the PIN fields
                  </Text>
                </Stack>

                {/* Numeric Keypad */}
                <Box width="full" maxW="300px" mx="auto">
                  <SimpleGrid columns={3} gap={2}>
                    {randomNumbers.slice(0, 9).map((num) => (
                      <Button
                        key={num}
                        size="lg"
                        variant="outline"
                        onClick={() => handleNumberClick(num.toString())}
                        disabled={isLoading || pin.length >= 4}
                        fontSize="xl"
                        height="60px"
                      >
                        {num}
                      </Button>
                    ))}
                    <Button
                      size="lg"
                      variant="outline"
                      colorScheme="red"
                      onClick={handleClear}
                      disabled={isLoading}
                      fontSize="sm"
                      height="60px"
                    >
                      Clear
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => handleNumberClick(randomNumbers[9]?.toString() || '0')}
                      disabled={isLoading || pin.length >= 4}
                      fontSize="xl"
                      height="60px"
                    >
                      {randomNumbers[9]}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      colorScheme="gray"
                      onClick={handleBackspace}
                      disabled={isLoading || pin.length === 0}
                      height="60px"
                    >
                      <FaBackspace size={20} />
                    </Button>
                  </SimpleGrid>
                </Box>
              </Box>

              {product && (
                <Box bg="bg.subtle" p={4} borderRadius="md">
                  <Stack gap={2}>
                    <Text fontSize="sm" color="fg.muted">
                      Product
                    </Text>
                    <Text fontWeight="semibold">{product.name}</Text>
                    <Text
                      fontSize="2xl"
                      fontWeight="bold"
                      color="colorPalette.600"
                    >
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
            colorScheme="green"
            onClick={handleSubmit}
            loading={isLoading}
            disabled={pin.length !== 4 || isLoading}
          >
            Verify PIN
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
