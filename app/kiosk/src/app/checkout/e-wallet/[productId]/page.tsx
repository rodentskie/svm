'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Container, Stack, Text, Card, Button, Flex } from '@chakra-ui/react';
import { FaArrowLeft, FaWallet } from 'react-icons/fa';
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
import { EmptyState } from '@svm/components/empty-state';
import { Skeleton } from '@svm/components/skeleton';
import { Tag } from '@svm/components/tag';
import { QrCode } from '@svm/components/qr-code';
import { Product } from '../../../../types';
import { 
  fetchProductById, 
  createPaymentMethod, 
  createPaymentIntent, 
  attachPaymentIntent,
  getPaymentIntentStatus 
} from '../../../../lib/api';

export default function EWalletCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState<string>('');

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

  // Poll payment intent status every 7 seconds while QR dialog is open
  useEffect(() => {
    if (!isQrDialogOpen || !paymentIntentId) return;

    const pollPaymentStatus = async () => {
      try {
        const statusRes = await getPaymentIntentStatus(paymentIntentId);
        const status = statusRes.data.attributes.status;
        
        console.log('Payment status:', status);
        
        if (status === 'succeeded') {
          // Payment successful, navigate to return URL
          setIsQrDialogOpen(false);
          router.push(returnUrl);
        }
      } catch (err) {
        console.error('Failed to check payment status:', err);
      }
    };

    // Poll immediately once
    pollPaymentStatus();

    // Then poll every 7 seconds
    const intervalId = setInterval(pollPaymentStatus, 7000);

    // Cleanup interval on unmount or when dialog closes
    return () => clearInterval(intervalId);
  }, [isQrDialogOpen, paymentIntentId, returnUrl, router]);

  const handleBack = () => {
    router.push('/');
  };

  const handleProceedToPayment = () => {
    setIsWalletDialogOpen(true);
  };

  const handleWalletSelect = async (walletType: 'gcash' | 'paymaya') => {
    if (!product) return;

    setSelectedWallet(walletType);
    setIsWalletDialogOpen(false);
    setIsQrDialogOpen(true);
    setIsProcessingPayment(true);
    setQrCodeUrl(null);
    setPaymentIntentId(null);

    try {
      // Step 1: Create payment method
      const paymentMethodRes = await createPaymentMethod(walletType);
      const paymentMethodId = paymentMethodRes.data.id;

      // Step 2: Create payment intent
      const amount = Math.round(product.price * 100); // Convert to cents
      const paymentIntentRes = await createPaymentIntent(amount, [walletType]);
      const intentId = paymentIntentRes.data.id;
      setPaymentIntentId(intentId);

      // Step 3: Attach payment intent
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const returnUrlValue = `${appUrl}/product/${product.id}/transaction/complete?payment_method=e-wallet&location=${encodeURIComponent(product.location)}&paymentIntentId=${encodeURIComponent(intentId)}`;
      setReturnUrl(returnUrlValue);
      const attachRes = await attachPaymentIntent(paymentMethodId, intentId, returnUrlValue);
      
      // Get redirect URL for QR code
      const redirectUrl = attachRes.data.attributes.next_action.redirect.url;
      setQrCodeUrl(redirectUrl);
    } catch (err) {
      console.error('Payment processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      setIsQrDialogOpen(false);
    } finally {
      setIsProcessingPayment(false);
    }
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
            <Text fontSize="3xl" fontWeight="bold" color="green.600" _dark={{ color: "green.400" }}>
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
                    <Text fontSize="3xl" fontWeight="bold" color="green.600" _dark={{ color: "green.400" }}>
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
              colorPalette="green"
              size="lg"
              flex={2}
              disabled={product.quantity === 0}
              onClick={handleProceedToPayment}
            >
              Proceed to Payment
            </Button>
          </Flex>
        </Stack>
      </Container>

      {/* E-Wallet Selection Dialog */}
      <DialogRoot open={isWalletDialogOpen} onOpenChange={(e) => !e.open && setIsWalletDialogOpen(false)} size="md">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select E-Wallet</DialogTitle>
            <DialogDescription>
              Choose your preferred e-wallet to complete the payment
            </DialogDescription>
          </DialogHeader>

          <DialogCloseTrigger />

          <DialogBody>
            <Stack gap={3}>
              <Button
                size="xl"
                variant="outline"
                colorPalette="green"
                onClick={() => handleWalletSelect('gcash')}
                height="auto"
                py={6}
              >
                <Box display="flex" alignItems="center" gap={4} width="100%">
                  <Box color="green.600" _dark={{ color: "green.400" }}>
                    <FaWallet size={24} />
                  </Box>
                  <Box flex={1} textAlign="left">
                    <Text fontSize="lg" fontWeight="bold">
                      GCash
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      Pay using your GCash wallet
                    </Text>
                  </Box>
                </Box>
              </Button>

              <Button
                size="xl"
                variant="outline"
                colorPalette="green"
                onClick={() => handleWalletSelect('paymaya')}
                height="auto"
                py={6}
              >
                <Box display="flex" alignItems="center" gap={4} width="100%">
                  <Box color="green.600">
                    <FaWallet size={24} />
                  </Box>
                  <Box flex={1} textAlign="left">
                    <Text fontSize="lg" fontWeight="bold">
                      PayMaya
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      Pay using your PayMaya wallet
                    </Text>
                  </Box>
                </Box>
              </Button>
            </Stack>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWalletDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* QR Code Payment Dialog */}
      <DialogRoot open={isQrDialogOpen} onOpenChange={(e) => !e.open && setIsQrDialogOpen(false)} size="lg">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan QR Code to Pay</DialogTitle>
            <DialogDescription>
              Open your {selectedWallet === 'gcash' ? 'GCash' : 'PayMaya'} app and scan the QR code below
            </DialogDescription>
          </DialogHeader>

          <DialogCloseTrigger />

          <DialogBody>
            <Stack gap={4} alignItems="center">
              {isProcessingPayment ? (
                <Box width="300px" height="300px" display="flex" alignItems="center" justifyContent="center">
                  <Stack gap={3} width="100%">
                    <Skeleton height="300px" width="300px" />
                    <Text textAlign="center" color="fg.muted">
                      Generating QR code...
                    </Text>
                  </Stack>
                </Box>
              ) : qrCodeUrl ? (
                <>
                  <Box p={4} borderRadius="md">
                    <QrCode value={qrCodeUrl} size={"xl"} />
                  </Box>
                  <Stack gap={2} textAlign="center">
                    <Text fontWeight="bold" fontSize="lg">
                      ₱{product?.price.toFixed(2)}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      Scan with your {selectedWallet === 'gcash' ? 'GCash' : 'PayMaya'} app
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      Payment status is being monitored automatically
                    </Text>
                  </Stack>
                </>
              ) : (
                <EmptyState
                  title="Failed to generate QR code"
                  description="Please try again"
                />
              )}
            </Stack>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQrDialogOpen(false)}>
              Cancel Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}
