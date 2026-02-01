'use client';

import { Box, Stack, Text, Button } from '@chakra-ui/react';
import { Skeleton } from '@svm/components/skeleton';
import { Category } from '../types';

interface CategorySidebarProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onCategorySelect: (categoryId: number) => void;
  isLoading?: boolean;
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onCategorySelect,
  isLoading = false,
}: CategorySidebarProps) {
  if (isLoading) {
    return (
      <Box
        width={{ base: '100%', md: '280px' }}
        height={{ base: 'auto', md: '100vh' }}
        bg="bg.subtle"
        borderRight={{ md: '1px solid' }}
        borderColor="border.subtle"
        overflowY="auto"
        flexShrink={0}
      >
        <Box p={6} borderBottom="1px solid" borderColor="border.subtle">
          <Skeleton height="8" width="60%" />
          <Skeleton height="4" width="80%" mt={2} />
        </Box>
        <Stack gap={2} p={4}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} height="12" width="100%" />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      width={{ base: '100%', md: '280px' }}
      height={{ base: 'auto', md: '100vh' }}
      bg="bg.subtle"
      borderRight={{ md: '1px solid' }}
      borderColor="border.subtle"
      overflowY="auto"
      flexShrink={0}
    >
      <Box p={6} borderBottom="1px solid" borderColor="border.subtle">
        <Text fontSize="2xl" fontWeight="bold">
          Categories
        </Text>
        <Text fontSize="sm" color="fg.muted" mt={1}>
          Select a category to browse
        </Text>
      </Box>

      <Stack gap={2} p={4}>
        {categories.map((category) => (
          <Button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            variant={selectedCategoryId === category.id ? 'solid' : 'ghost'}
            colorPalette={selectedCategoryId === category.id ? 'blue' : 'gray'}
            size="lg"
            justifyContent="flex-start"
            width="100%"
            px={4}
            py={6}
            fontWeight={selectedCategoryId === category.id ? 'bold' : 'normal'}
          >
            {category.name}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}
