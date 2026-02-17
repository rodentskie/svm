'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Flex, Container, Text, Stack } from '@chakra-ui/react';
import { EmptyState } from '@svm/components/empty-state';
import { CategorySidebar } from '../components/CategorySidebar';
import { ProductGrid } from '../components/ProductGrid';
import { PaymentMethodDialog } from '../components/PaymentMethodDialog';
import { RFIDInputDialog } from '../components/RFIDInputDialog';
import { fetchCategories, fetchProductsByCategory, fetchStudentByRFID } from '../lib/api';
import { Category, Product, PaymentMethod } from '../types';

export default function MainPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isRFIDDialogOpen, setIsRFIDDialogOpen] = useState(false);
  const [isLoadingRFID, setIsLoadingRFID] = useState(false);
  const [rfidError, setRfidError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        setIsLoadingCategories(true);
        const data = await fetchCategories();
        setCategories(data);
        
        // Auto-select first category
        if (data.length > 0) {
          setSelectedCategoryId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setIsLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  // Fetch products when category changes
  useEffect(() => {
    async function loadProducts() {
      if (!selectedCategoryId) {
        setProducts([]);
        return;
      }

      try {
        setIsLoadingProducts(true);
        setError(null);
        const data = await fetchProductsByCategory(selectedCategoryId);
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    }

    loadProducts();
  }, [selectedCategoryId]);

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
  };

  const handleBuy = (product: Product) => {
    setSelectedProduct(product);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSelect = (paymentMethod: PaymentMethod, product: Product) => {
    const methodName = paymentMethod.name.toLowerCase();
    
    if (methodName.includes('wallet') || methodName.includes('e-wallet')) {
      router.push(`/checkout/e-wallet/${product.id}`);
    } else if (methodName.includes('rfid')) {
      setIsRFIDDialogOpen(true);
      setRfidError(null);
    } else {
      console.log('Payment method selected:', paymentMethod.name);
      console.log('Product:', product.name);
      console.log('Price:', product.price);
    }
  };

  const handleRFIDSubmit = async (rfid: string, product: Product) => {
    try {
      setIsLoadingRFID(true);
      setRfidError(null);
      
      const studentData = await fetchStudentByRFID(rfid);
      
      // Redirect to RFID checkout page with student and product data
      setIsRFIDDialogOpen(false);
      router.push(`/checkout/rfid/${product.id}?rfid=${encodeURIComponent(rfid)}&load=${studentData.load}`);
    } catch (err) {
      setRfidError(err instanceof Error ? err.message : 'Failed to verify RFID');
    } finally {
      setIsLoadingRFID(false);
    }
  };

  if (error && categories.length === 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bg="bg.canvas"
      >
        <EmptyState
          title="Error Loading Kiosk"
          description={error}
        />
      </Box>
    );
  }

  return (
    <Flex direction={{ base: 'column', md: 'row' }} minHeight="100vh" bg="bg.canvas">
      {/* Sidebar */}
      <CategorySidebar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
        isLoading={isLoadingCategories}
      />

      {/* Main Content */}
      <Box flex={1} overflowY="auto">
        <Container maxW="container.2xl" py={8} px={6}>
          <Stack gap={6}>
            {/* Header */}
            <Box>
              <Text fontSize="3xl" fontWeight="bold" color="green.600" _dark={{ color: "green.400" }}>
                {categories.find((c) => c.id === selectedCategoryId)?.name || 'Products'}
              </Text>
              <Text fontSize="sm" color="fg.muted" mt={1}>
                Browse and select products to order
              </Text>
            </Box>

            {/* Products Grid */}
            {error && products.length === 0 ? (
              <EmptyState
                title="Failed to load products"
                description={error}
              />
            ) : (
              <ProductGrid
                products={products}
                onAddToCart={handleBuy}
                isLoading={isLoadingProducts}
              />
            )}
          </Stack>
        </Container>
      </Box>

      {/* Payment Method Dialog */}
      <PaymentMethodDialog
        open={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        product={selectedProduct}
        onPaymentSelect={handlePaymentSelect}
      />

      {/* RFID Input Dialog */}
      <RFIDInputDialog
        open={isRFIDDialogOpen}
        onClose={() => {
          setIsRFIDDialogOpen(false);
          setRfidError(null);
        }}
        product={selectedProduct}
        onSubmit={handleRFIDSubmit}
        isLoading={isLoadingRFID}
        error={rfidError}
      />
    </Flex>
  );
}
