'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Spinner,
  Text,
  Badge,
  Button,
  HStack,
  VStack,
  Input,
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { toaster, Toaster } from '@svm/components/toaster';
import {
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
} from '@svm/components/dialog';
import { Field } from '@svm/components/field';
import { DeleteConfirmDialog } from '../../../components/DeleteConfirmDialog';

interface Product {
  id: number;
  name: string;
  code: string;
  price: number;
  quantity: number;
  min_threshold: number;
  location: string;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductForm {
  name: string;
  code: string;
  location: string;
  price: number | string;
  quantity: number | string;
  min_threshold: number | string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    code: '',
    location: '',
    price: '',
    quantity: '',
    min_threshold: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      const response = await fetch(`${apiUrl}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductForm, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      location: '',
      price: '',
      quantity: '',
      min_threshold: '',
    });
  };

  const handleCreateProduct = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      const response = await fetch(`${apiUrl}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          quantity: Number(formData.quantity),
          min_threshold: Number(formData.min_threshold),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      toaster.create({
        title: 'Success',
        description: 'Product created successfully',
        type: 'success',
        duration: 3000,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create product',
        type: 'error',
        duration: 3000,
      });
      console.error('Error creating product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      location: product.location,
      price: product.price,
      quantity: product.quantity,
      min_threshold: product.min_threshold,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      const response = await fetch(`${apiUrl}/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          quantity: Number(formData.quantity),
          min_threshold: Number(formData.min_threshold),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      toaster.create({
        title: 'Success',
        description: 'Product updated successfully',
        type: 'success',
        duration: 3000,
      });

      setIsEditDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update product',
        type: 'error',
        duration: 3000,
      });
      console.error('Error updating product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setDeleteConfirmText('');
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      const response = await fetch(`${apiUrl}/products/${deletingProduct.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      toaster.create({
        title: 'Success',
        description: 'Product deleted successfully',
        type: 'success',
        duration: 3000,
      });

      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      setDeleteConfirmText('');
      fetchProducts();
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete product',
        type: 'error',
        duration: 3000,
      });
      console.error('Error deleting product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Toaster />
        <Box p={8} display="flex" justifyContent="center" alignItems="center" minH="400px">
          <VStack gap={4}>
            <Spinner size="xl" />
            <Text>Loading products...</Text>
          </VStack>
        </Box>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Toaster />
        <Box p={8}>
          <Text color="red.500">Error: {error}</Text>
          <Button mt={4} onClick={fetchProducts}>
            Retry
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <Box p={8}>
        <VStack align="stretch" gap={6}>
          {/* Header */}
          <HStack justify="space-between">
            <Heading size="lg" color="green.600" _dark={{ color: "green.400" }}>Products Management</Heading>
            <Button colorPalette="green" onClick={() => setIsDialogOpen(true)}>
              <FiPlus />
              Add New Product
            </Button>
          </HStack>

          {/* Create Product Dialog */}
          <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
            <DialogBackdrop />
            <DialogContent>
              <DialogHeader>
                <DialogTitle color="green.600" _dark={{ color: "green.400" }}>Add New Product</DialogTitle>
              </DialogHeader>
              <DialogCloseTrigger />
              <DialogBody>
                <VStack gap={4}>
                  <Field label="Product Name" required>
                    <Input
                      placeholder="Enter product name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </Field>

                  <Field label="Product Code" required>
                    <Input
                      placeholder="Enter product code"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                    />
                  </Field>

                  <Field label="Location" required>
                    <Input
                      placeholder="Enter location (e.g., A-1)"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </Field>

                  <Field label="Price" required>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter price"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                    />
                  </Field>

                  <Field label="Quantity" required>
                    <Input
                      type="number"
                      placeholder="Enter quantity"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                    />
                  </Field>

                  <Field label="Min Threshold" required>
                    <Input
                      type="number"
                      placeholder="Enter minimum threshold"
                      value={formData.min_threshold}
                      onChange={(e) => handleInputChange('min_threshold', e.target.value)}
                    />
                  </Field>
                </VStack>
              </DialogBody>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button colorPalette="green" onClick={handleCreateProduct} loading={isSubmitting}>
                  Create Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </DialogRoot>

          {/* Edit Product Dialog */}
          <DialogRoot open={isEditDialogOpen} onOpenChange={(e) => setIsEditDialogOpen(e.open)}>
            <DialogBackdrop />
            <DialogContent>
              <DialogHeader>
                <DialogTitle color="green.600" _dark={{ color: "green.400" }}>Edit Product</DialogTitle>
              </DialogHeader>
              <DialogCloseTrigger />
              <DialogBody>
                <VStack gap={4}>
                  <Field label="Product Name" required>
                    <Input
                      placeholder="Enter product name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </Field>

                  <Field label="Product Code" required>
                    <Input
                      placeholder="Enter product code"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                    />
                  </Field>

                  <Field label="Location" required>
                    <Input
                      placeholder="Enter location (e.g., A-1)"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </Field>

                  <Field label="Price" required>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter price"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                    />
                  </Field>

                  <Field label="Quantity" required>
                    <Input
                      type="number"
                      placeholder="Enter quantity"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                    />
                  </Field>

                  <Field label="Min Threshold" required>
                    <Input
                      type="number"
                      placeholder="Enter minimum threshold"
                      value={formData.min_threshold}
                      onChange={(e) => handleInputChange('min_threshold', e.target.value)}
                    />
                  </Field>
                </VStack>
              </DialogBody>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button colorPalette="green" onClick={handleUpdateProduct} loading={isSubmitting}>
                  Update Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </DialogRoot>

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => {
              setIsDeleteDialogOpen(false);
              setDeletingProduct(null);
              setDeleteConfirmText('');
            }}
            onConfirm={handleDeleteProduct}
            isSubmitting={isSubmitting}
            itemName={deletingProduct?.name || ''}
            itemType="Product"
            confirmText={deleteConfirmText}
            onConfirmTextChange={setDeleteConfirmText}
          />

          {/* Products Table */}
          <Box
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            bg="white"
            _dark={{ bg: 'gray.800' }}
          >
            <Table.Root size="lg" variant="outline">
              <Table.Header>
                <Table.Row bg="gray.50" _dark={{ bg: 'gray.700' }}>
                  <Table.ColumnHeader>Code</Table.ColumnHeader>
                  <Table.ColumnHeader>Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Location</Table.ColumnHeader>
                  <Table.ColumnHeader>Price</Table.ColumnHeader>
                  <Table.ColumnHeader>Quantity</Table.ColumnHeader>
                  <Table.ColumnHeader>Min Threshold</Table.ColumnHeader>
                  <Table.ColumnHeader>Stock Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Last Updated</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {products.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={9} textAlign="center" py={8}>
                      <Text color="gray.500">No products found</Text>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  products.map((product) => (
                    <Table.Row key={product.id} _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}>
                      <Table.Cell fontWeight="medium">{product.code}</Table.Cell>
                      <Table.Cell>{product.name}</Table.Cell>
                      <Table.Cell>{product.location}</Table.Cell>
                      <Table.Cell>₱{product.price.toFixed(2)}</Table.Cell>
                      <Table.Cell>{product.quantity}</Table.Cell>
                      <Table.Cell>{product.min_threshold}</Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={product.is_low_stock ? 'red' : 'green'}>
                          {product.is_low_stock ? 'LOW STOCK' : 'IN STOCK'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="sm">{product.updated_at}</Table.Cell>
                      <Table.Cell>
                        <HStack gap={2} justify="center">
                          <Button
                            size="sm"
                            variant="outline"
                            colorPalette="green"
                            onClick={() => handleEditClick(product)}
                          >
                            <FiEdit2 />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            colorPalette="red"
                            onClick={() => handleDeleteClick(product)}
                          >
                            <FiTrash2 />
                            Delete
                          </Button>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Root>
          </Box>

          {/* Summary */}
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
              Total Products: {products.length}
            </Text>
            <Text fontSize="sm" color="red.600" _dark={{ color: 'red.400' }}>
              Low Stock Items: {products.filter((p) => p.is_low_stock).length}
            </Text>
          </HStack>
        </VStack>
      </Box>
    </>
  );
}
