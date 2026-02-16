'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Box, Container, Stack, Text, Card, Button, Flex } from '@chakra-ui/react';
import { FaArrowLeft, FaIdCard, FaWallet, FaExclamationTriangle } from 'react-icons/fa';
import { EmptyState } from '@svm/components/empty-state';
import { Skeleton } from '@svm/components/skeleton';
import { Tag } from '@svm/components/tag';
import { Product } from '../../../../types';
import { fetchProductById, validateStudentPIN } from '../../../../lib/api';
import { PINInputDialog } from '../../../../components/PINInputDialog';

export default function RFIDCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params.productId as string;
  const rfid = searchParams.get('rfid') || '';
  const load = parseFloat(searchParams.get('load') || '0');
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPINDialogOpen, setIsPINDialogOpen] = useState(false);
  const [isPINValidating, setIsPINValidating] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchProductById(productId);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    }

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleBack = () => {
    router.push('/');
  };

  const handleConfirm = () => {
    if (!product || load < product.price) return;
    
    // Open PIN dialog for validation
    setIsPINDialogOpen(true);
    setPinError(null);
  };

  const handlePINSubmit = async (pin: string, product: Product) => {
    try {
      setIsPINValidating(true);
      setPinError(null);
      
      // Validate PIN
      await validateStudentPIN(rfid, pin);
      
      // PIN is valid, proceed to transaction complete page
      setIsPINDialogOpen(false);
      const completeUrl = `/product/${product.id}/transaction/complete?payment_method=rfid&location=${encodeURIComponent(product.location)}&rfid=${encodeURIComponent(rfid)}&paymentIntentId=`;
      router.push(completeUrl);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Failed to validate PIN');
    } finally {
      setIsPINValidating(false);
    }
  };

  const canAfford = product ? load >= product.price : false;

  if (error) {
    return (
      <Container maxW="container.md" py={8}>
        <Stack gap={4}>
          <Button
            variant="ghost"
            onClick={handleBack}
            alignSelf="flex-start"
          >
            <FaArrowLeft />
            Back to Products
          </Button>
          <EmptyState title="Error Loading Product" description={error} />
        </Stack>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <Stack gap={6}>
          <Skeleton height="10" width="200px" />
          <Card.Root>
            <Card.Body p={8}>
              <Stack gap={4}>
                <Skeleton height="8" width="60%" />
                <Skeleton height="6" width="80%" />
                <Skeleton height="10" width="40%" />
                <Skeleton height="12" width="100%" />
              </Stack>
            </Card.Body>
          </Card.Root>
        </Stack>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxW="container.md" py={8}>
        <EmptyState title="Product not found" description="The product you're looking for doesn't exist" />
      </Container>
    );
  }

  return (
    <Box minHeight="100vh" bg="bg.canvas">
      <Container maxW="container.md" py={8}>
        <Stack gap={6}>
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleBack}
            alignSelf="flex-start"
          >
            <FaArrowLeft />
            Back to Products
          </Button>

          {/* Page Header */}
          <Box>
            <Text fontSize="3xl" fontWeight="bold">
              RFID Payment
            </Text>
            <Text fontSize="md" color="fg.muted" mt={1}>
              Review your order and confirm payment
            </Text>
          </Box>

          {/* Product Card */}
          <Card.Root>
            <Card.Header>
              <Text fontSize="xl" fontWeight="semibold">
                Order Summary
              </Text>
            </Card.Header>
            <Card.Body>
              <Stack gap={6}>
                {/* Product Info */}
                <Box>
                  <Text fontSize="sm" color="fg.muted" mb={2}>
                    Product
                  </Text>
                  <Flex justify="space-between" align="start">
                    <Box>
                      <Text fontSize="lg" fontWeight="semibold">
                        {product.name}
                      </Text>
                      <Text fontSize="sm" color="fg.muted">
                        Code: {product.code}
                      </Text>
                      <Text fontSize="sm" color="fg.muted">
                        Location: {product.location}
                      </Text>
                    </Box>
                    <Text fontSize="2xl" fontWeight="bold" color="colorPalette.600">
                      ₱{product.price.toFixed(2)}
                    </Text>
                  </Flex>
                </Box>

                {/* Load Balance */}
                <Box borderTopWidth="1px" pt={4}>
                  <Flex align="center" gap={2} mb={3}>
                    <FaWallet />
                    <Text fontSize="sm" color="fg.muted">
                      Current Load Balance
                    </Text>
                  </Flex>
                  <Text fontSize="2xl" fontWeight="bold" color={canAfford ? 'green.600' : 'red.600'}>
                    ₱{load.toFixed(2)}
                  </Text>
                </Box>

                {/* Insufficient Balance Warning */}
                {!canAfford && (
                  <Box
                    bg="red.50"
                    borderWidth="1px"
                    borderColor="red.200"
                    borderRadius="md"
                    p={4}
                  >
                    <Flex align="start" gap={3}>
                      <Box color="red.600" mt={1}>
                        <FaExclamationTriangle />
                      </Box>
                      <Box flex={1}>
                        <Text fontWeight="semibold" color="red.900" mb={1}>
                          Insufficient Balance
                        </Text>
                        <Text fontSize="sm" color="red.800">
                          Your current load balance is not enough to complete this purchase.
                          You need at least ₱{product.price.toFixed(2)}. Please top up your account.
                        </Text>
                        <Text fontSize="sm" color="red.800" mt={2}>
                          Amount needed: ₱{(product.price - load).toFixed(2)}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                )}

                {/* Balance After Purchase */}
                {canAfford && (
                  <Box bg="bg.subtle" p={4} borderRadius="md">
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" color="fg.muted">
                        Balance after purchase
                      </Text>
                      <Text fontSize="lg" fontWeight="semibold">
                        ₱{(load - product.price).toFixed(2)}
                      </Text>
                    </Flex>
                  </Box>
                )}
              </Stack>
            </Card.Body>
            <Card.Footer>
              <Flex width="full" gap={3}>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  flex={1}
                  size="lg"
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleConfirm}
                  flex={1}
                  size="lg"
                  disabled={!canAfford}
                >
                  Confirm Payment
                </Button>
              </Flex>
            </Card.Footer>
          </Card.Root>
        </Stack>
      </Container>

      {/* PIN Input Dialog */}
      <PINInputDialog
        open={isPINDialogOpen}
        onClose={() => {
          setIsPINDialogOpen(false);
          setPinError(null);
        }}
        product={product}
        rfid={rfid}
        onSubmit={handlePINSubmit}
        isLoading={isPINValidating}
        error={pinError}
      />
    </Box>
  );
}
