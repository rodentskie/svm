'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Box, Container, Stack, Text, Button } from '@chakra-ui/react';
import { FaCheckCircle } from 'react-icons/fa';
import { createTransaction } from '../../../../../lib/api';

export default function TransactionCompletePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params.productId as string;
  const [isProcessing, setIsProcessing] = useState(true);

  async function recordTransaction() {
    try {
      if (isProcessing) {
        const paymentMethod = searchParams.get('payment_method') || 'e-wallet';
        const location = searchParams.get('location') || 'A-1';
        const rfid = searchParams.get('rfid') || '';
        const paymentIntentId = searchParams.get('paymentIntentId') || '';

        const payMongoPaymentIntent = searchParams.get('payment_intent_id');
        if (!payMongoPaymentIntent) {
          await createTransaction(
            location,
            'purchase',
            1,
            paymentMethod,
            rfid,
            paymentIntentId,
          );
          console.log('Transaction recorded successfully');
        }
      }
    } catch (err) {
      console.error('Failed to record transaction:', err);
    } finally {
      setIsProcessing(false);
    }
  }

  useEffect(() => {
    (async () => {
      await recordTransaction();
    })();
  }, [isProcessing]);

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <Box
      minHeight="100vh"
      bg="bg.canvas"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxW="container.sm">
        <Stack gap={6} textAlign="center" p={8}>
          <Box display="flex" justifyContent="center">
            <Box color="green.500" fontSize="6xl">
              <FaCheckCircle />
            </Box>
          </Box>

          <Stack gap={2}>
            <Text fontSize="3xl" fontWeight="bold">
              Payment Successful!
            </Text>
            <Text fontSize="lg" color="fg.muted">
              Your transaction has been completed successfully
            </Text>
          </Stack>

          <Stack gap={3} mt={4}>
            <Text fontSize="sm" color="fg.muted">
              Please collect your item from the vending machine
            </Text>
          </Stack>

          <Button colorPalette="blue" size="lg" onClick={handleGoHome} mt={4}>
            Back to Home
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
