'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Box, Container, Stack, Text, Card, Button, Flex } from '@chakra-ui/react';
import { FaArrowLeft, FaWallet } from 'react-icons/fa';
import { EmptyState } from '@svm/components/empty-state';
import { Skeleton } from '@svm/components/skeleton';
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
    if (!product) return;
    
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

  const projectedTotal = product ? load + product.price : load;

  if (error) {
    return (
      <Container maxW="container.md" py={4}>
        <Stack gap={4}>
          <Button
            variant="ghost"
            onClick={handleBack}
            alignSelf="flex-start"
            size="sm"
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
      <Container maxW="container.md" py={4}>
        <Stack gap={4}>
          <Skeleton height="10" width="200px" />
          <Card.Root>
            <Card.Body p={6}>
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
      <Container maxW="container.md" py={4}>
        <EmptyState title="Product not found" description="The product you're looking for doesn't exist" />
      </Container>
    );
  }

  return (
    <Box minHeight="100vh" bg="bg.canvas">
      <Container maxW="container.md" py={4}>
        <Stack gap={4}>
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleBack}
            alignSelf="flex-start"
            size="sm"
          >
            <FaArrowLeft />
            Back to Products
          </Button>

          {/* Page Header */}
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="green.600" _dark={{ color: "green.400" }}>
              RFID Payment
            </Text>
            <Text fontSize="sm" color="fg.muted" mt={1}>
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
              <Stack gap={4}>
                {/* Product Info */}
                <Box>
                  <Text fontSize="sm" color="fg.muted" mb={2}>
                    Product
                  </Text>
                  <Flex justify="space-between" align="start">
                    <Box>
                      <Text fontSize="md" fontWeight="semibold">
                        {product.name}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        Code: {product.code}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        Location: {product.location}
                      </Text>
                    </Box>
                    <Text fontSize="xl" fontWeight="bold" color="colorPalette.600">
                      ₱{product.price.toFixed(2)}
                    </Text>
                  </Flex>
                </Box>

                {/* Load Balance */}
                <Box borderTopWidth="1px" pt={4}>
                  <Flex align="center" gap={2} mb={3}>
                    <FaWallet />
                    <Text fontSize="xs" color="fg.muted">
                      Current Running Total
                    </Text>
                  </Flex>
                  <Text fontSize="xl" fontWeight="bold" color="colorPalette.600">
                    ₱{load.toFixed(2)}
                  </Text>
                </Box>

                {/* Running Total After Purchase */}
                <Box bg="bg.subtle" p={3} borderRadius="md">
                  <Flex justify="space-between" align="center">
                    <Text fontSize="xs" color="fg.muted">
                      Total after this purchase
                    </Text>
                    <Text fontSize="md" fontWeight="semibold">
                      ₱{projectedTotal.toFixed(2)}
                    </Text>
                  </Flex>
                </Box>
              </Stack>
            </Card.Body>
            <Card.Footer>
              <Flex width="full" gap={3}>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  flex={1}
                  size="md"
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="green"
                  onClick={handleConfirm}
                  flex={1}
                  size="md"
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
