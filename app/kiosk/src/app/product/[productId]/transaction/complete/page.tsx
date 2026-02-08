'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Container, Stack, Text, Button } from '@chakra-ui/react';
import { FaCheckCircle } from 'react-icons/fa';

export default function TransactionCompletePage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  useEffect(() => {
    // TODO: Verify payment status with backend
    console.log('Transaction complete for product:', productId);
  }, [productId]);

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <Box minHeight="100vh" bg="bg.canvas" display="flex" alignItems="center" justifyContent="center">
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
            <Text fontSize="sm" color="fg.muted">
              Transaction ID: {params.productId}
            </Text>
          </Stack>

          <Button
            colorPalette="blue"
            size="lg"
            onClick={handleGoHome}
            mt={4}
          >
            Back to Home
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
