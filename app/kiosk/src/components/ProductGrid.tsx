'use client';

import { Box, Grid, Card, Text, Button, Stack } from '@chakra-ui/react';
import { EmptyState } from '@svm/components/empty-state';
import { Skeleton } from '@svm/components/skeleton';
import { Tag } from '@svm/components/tag';
import { Product } from '../types';

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  isLoading?: boolean;
}

export function ProductGrid({ products, onAddToCart, isLoading = false }: ProductGridProps) {
  if (isLoading) {
    return (
      <Grid
        templateColumns={{
          base: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        }}
        gap={6}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <Card.Root key={index}>
            <Card.Body p={6}>
              <Stack gap={3}>
                <Skeleton height="6" width="70%" />
                <Skeleton height="4" width="90%" />
                <Skeleton height="8" width="50%" />
                <Skeleton height="4" width="40%" />
                <Skeleton height="10" width="100%" />
              </Stack>
            </Card.Body>
          </Card.Root>
        ))}
      </Grid>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Select a category to view available products"
      />
    );
  }

  return (
    <Grid
      templateColumns={{
        base: '1fr',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(3, 1fr)',
        lg: 'repeat(4, 1fr)',
      }}
      gap={6}
    >
      {products.map((product) => (
        <Card.Root key={product.id} overflow="hidden">
          <Card.Body p={6}>
            <Stack gap={3}>
              <Box>
                <Text fontSize="lg" fontWeight="bold" lineHeight="tight">
                  {product.name}
                </Text>
              </Box>

              <Box>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  ₱{product.price.toFixed(2)}
                </Text>
                <Tag
                  size="sm"
                  colorPalette={
                    product.quantity === 0 ? 'red' : product.is_low_stock ? 'orange' : 'green'
                  }
                  mt={2}
                >
                  {product.quantity === 0
                    ? 'Out of stock'
                    : `${product.quantity} in stock${product.is_low_stock ? ' (Low)' : ''}`}
                </Tag>
              </Box>

              <Button
                colorPalette="blue"
                size="md"
                width="100%"
                disabled={product.quantity === 0}
                onClick={() => onAddToCart?.(product)}
              >
                {product.quantity === 0 ? 'Out of Stock' : 'Buy'}
              </Button>
            </Stack>
          </Card.Body>
        </Card.Root>
      ))}
    </Grid>
  );
}
