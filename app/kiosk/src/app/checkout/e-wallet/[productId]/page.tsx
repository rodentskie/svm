'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Container, Stack, Text, Card, Button, Flex } from '@chakra-ui/react';
import { FaArrowLeft } from 'react-icons/fa';
import { EmptyState } from '@svm/components/empty-state';
import { Skeleton } from '@svm/components/skeleton';
import { Tag } from '@svm/components/tag';
import { Product } from '../../../../types';
import { fetchProductById } from '../../../../lib/api';

export default function EWalletCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

          {/* Header */}
          <Box>
            <Text fontSize="3xl" fontWeight="bold">
              E-Wallet Checkout
            </Text>
            <Text fontSize="sm" color="fg.muted" mt={1}>
              Complete your purchase with E-Wallet
            </Text>
          </Box>

          {/* Product Details Card */}
          <Card.Root>
            <Card.Header>
              <Text fontSize="xl" fontWeight="bold">
                Order Summary
              </Text>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                <Flex justify="space-between" align="start">
                  <Box flex={1}>
                    <Text fontSize="2xl" fontWeight="bold">
                      {product.name}
                    </Text>
                    <Text fontSize="sm" color="fg.muted" mt={1}>
                      Code: {product.code} | Location: {product.location}
                    </Text>
                  </Box>
                  <Tag
                    size="sm"
                    colorPalette={
                      product.quantity === 0 ? 'red' : product.is_low_stock ? 'orange' : 'green'
                    }
                  >
                    {product.quantity === 0
                      ? 'Out of stock'
                      : `${product.quantity} in stock${product.is_low_stock ? ' (Low)' : ''}`}
                  </Tag>
                </Flex>

                <Box borderTop="1px solid" borderColor="border.subtle" pt={4}>
                  <Flex justify="space-between" align="center">
                    <Text fontSize="lg" fontWeight="medium">
                      Total Amount
                    </Text>
                    <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                      ₱{product.price.toFixed(2)}
                    </Text>
                  </Flex>
                </Box>
              </Stack>
            </Card.Body>
          </Card.Root>

          {/* Payment Instructions Card */}
          <Card.Root>
            <Card.Header>
              <Text fontSize="xl" fontWeight="bold">
                Payment Instructions
              </Text>
            </Card.Header>
            <Card.Body>
              <Stack gap={3}>
                <Text color="fg.muted">
                  1. Open your E-Wallet app (GCash, PayMaya, etc.)
                </Text>
                <Text color="fg.muted">
                  2. Scan the QR code that will appear after confirming
                </Text>
                <Text color="fg.muted">
                  3. Complete the payment in your E-Wallet app
                </Text>
                <Text color="fg.muted">
                  4. Wait for confirmation and collect your item
                </Text>
              </Stack>
            </Card.Body>
          </Card.Root>

          {/* Action Buttons */}
          <Flex gap={3} direction={{ base: 'column', sm: 'row' }}>
            <Button
              variant="outline"
              onClick={handleBack}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              colorPalette="blue"
              size="lg"
              flex={2}
              disabled={product.quantity === 0}
            >
              Proceed to Payment
            </Button>
          </Flex>
        </Stack>
      </Container>
    </Box>
  );
}
