'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Spinner,
  Text,
  Button,
  HStack,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { FiEye, FiRefreshCw, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
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

interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  code: string;
  price: number;
  quantity: number;
  min_threshold: number;
  location: string;
  category_id: number;
  category: Category;
  created_at: string;
  updated_at: string;
}

interface TransactionDetails {
  id: number;
  transaction_id: number;
  rfid: string;
  payment_intent_id: string;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: number;
  product_id: number;
  quantity: number;
  transaction_type: string;
  payment_method: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  product: Product;
  transaction_details: TransactionDetails;
}

interface PaginationInfo {
  limit: number;
  offset: number;
  total: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    limit: 5,
    offset: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (limit?: number, offset?: number) => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';
      const queryLimit = limit !== undefined ? limit : pagination.limit;
      const queryOffset = offset !== undefined ? offset : pagination.offset;

      const response = await fetch(
        `${apiUrl}/transactions?limit=${queryLimit}&offset=${queryOffset}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const result = await response.json();
      setTransactions(result.data || []);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching transactions:', err);
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch transactions',
        type: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsDialogOpen(true);
  };

  const handleNextPage = () => {
    const newOffset = pagination.offset + pagination.limit;
    if (newOffset < pagination.total) {
      fetchTransactions(pagination.limit, newOffset);
    }
  };

  const handlePreviousPage = () => {
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    fetchTransactions(pagination.limit, newOffset);
  };

  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      // Fetch all transactions (using a large limit to get all data)
      const response = await fetch(
        `${apiUrl}/transactions?limit=${pagination.total}&offset=0`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions for export');
      }

      const result = await response.json();
      const allTransactions: Transaction[] = result.data || [];

      // Format data for Excel
      const excelData = allTransactions.map((transaction) => ({
        'Transaction ID': transaction.id,
        'Product Name': transaction.product.name,
        'Product Code': transaction.product.code,
        'Product Location': transaction.product.location,
        'Quantity': transaction.quantity,
        'Unit Price': transaction.product.price,
        'Total Amount': transaction.total_amount,
        'Transaction Type': transaction.transaction_type,
        'Payment Method': transaction.payment_method,
        'Status': transaction.status,
        'RFID': transaction.transaction_details?.rfid || 'N/A',
        'Payment Intent ID': transaction.transaction_details?.payment_intent_id || 'N/A',
        'Date': new Date(transaction.created_at).toLocaleString(),
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

      // Set column widths for better readability
      const columnWidths = [
        { wch: 15 }, // Transaction ID
        { wch: 25 }, // Product Name
        { wch: 15 }, // Product Code
        { wch: 18 }, // Product Location
        { wch: 10 }, // Quantity
        { wch: 12 }, // Unit Price
        { wch: 15 }, // Total Amount
        { wch: 18 }, // Transaction Type
        { wch: 18 }, // Payment Method
        { wch: 12 }, // Status
        { wch: 15 }, // RFID
        { wch: 30 }, // Payment Intent ID
        { wch: 20 }, // Date
      ];
      worksheet['!cols'] = columnWidths;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `transaction-data-${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toaster.create({
        title: 'Success',
        description: `Exported ${allTransactions.length} transactions to ${filename}`,
        type: 'success',
        duration: 3000,
      });
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to export transactions',
        type: 'error',
        duration: 3000,
      });
      console.error('Error exporting transactions:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      case 'cancelled':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    return method === 'rfid' ? 'blue' : 'purple';
  };

  if (isLoading) {
    return (
      <>
        <Toaster />
        <Box p={8} display="flex" justifyContent="center" alignItems="center" minH="400px">
          <VStack gap={4}>
            <Spinner size="xl" />
            <Text>Loading transactions...</Text>
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
          <Button mt={4} onClick={() => fetchTransactions()}>
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
            <Heading size="lg">Transactions</Heading>
            <HStack gap={2}>
              <Button
                colorScheme="green"
                onClick={handleExportToExcel}
                loading={isExporting}
                disabled={pagination.total === 0}
              >
                <FiDownload />
                Export to Excel
              </Button>
              <Button colorScheme="blue" onClick={() => fetchTransactions()}>
                <FiRefreshCw />
                Refresh
              </Button>
            </HStack>
          </HStack>

          {/* Pagination Controls */}
          <Box
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            bg="gray.50"
            _dark={{ bg: 'gray.700' }}
          >
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                Showing {pagination.offset + 1} to{' '}
                {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
                {pagination.total} transactions
              </Text>
              <HStack gap={2}>
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={pagination.offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                >
                  Next
                </Button>
              </HStack>
            </HStack>
          </Box>

          {/* Transaction Details Dialog */}
          <DialogRoot
            open={isDetailsDialogOpen}
            onOpenChange={(e) => setIsDetailsDialogOpen(e.open)}
            size="xl"
          >
            <DialogBackdrop />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transaction Details - ID: {selectedTransaction?.id}</DialogTitle>
              </DialogHeader>
              <DialogCloseTrigger />
              <DialogBody>
                {selectedTransaction && (
                  <VStack align="stretch" gap={6}>
                    {/* Transaction Info */}
                    <Box>
                      <Heading size="sm" mb={3}>
                        Transaction Information
                      </Heading>
                      <VStack align="stretch" gap={2}>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Type:</Text>
                          <Badge colorScheme="blue">
                            {selectedTransaction.transaction_type}
                          </Badge>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Status:</Text>
                          <Badge colorScheme={getStatusColor(selectedTransaction.status)}>
                            {selectedTransaction.status}
                          </Badge>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Payment Method:</Text>
                          <Badge
                            colorScheme={getPaymentMethodBadge(selectedTransaction.payment_method)}
                          >
                            {selectedTransaction.payment_method}
                          </Badge>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Quantity:</Text>
                          <Text>{selectedTransaction.quantity}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Total Amount:</Text>
                          <Text fontWeight="bold" fontSize="lg">
                            ₱{selectedTransaction.total_amount.toFixed(2)}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Created At:</Text>
                          <Text fontSize="sm">
                            {new Date(selectedTransaction.created_at).toLocaleString()}
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>

                    {/* Product Info */}
                    <Box>
                      <Heading size="sm" mb={3}>
                        Product Information
                      </Heading>
                      <VStack align="stretch" gap={2}>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Product Name:</Text>
                          <Text>{selectedTransaction.product.name}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Product Code:</Text>
                          <Text>{selectedTransaction.product.code}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Location:</Text>
                          <Text>{selectedTransaction.product.location}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Price:</Text>
                          <Text>₱{selectedTransaction.product.price.toFixed(2)}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Current Stock:</Text>
                          <Text>{selectedTransaction.product.quantity}</Text>
                        </HStack>
                      </VStack>
                    </Box>

                    {/* Transaction Details */}
                    <Box>
                      <Heading size="sm" mb={3}>
                        Payment Details
                      </Heading>
                      <VStack align="stretch" gap={2}>
                        {selectedTransaction.transaction_details.rfid && (
                          <HStack justify="space-between">
                            <Text fontWeight="medium">RFID:</Text>
                            <Text>{selectedTransaction.transaction_details.rfid}</Text>
                          </HStack>
                        )}
                        {selectedTransaction.transaction_details.payment_intent_id && (
                          <HStack justify="space-between">
                            <Text fontWeight="medium">Payment Intent ID:</Text>
                            <Text fontSize="sm">
                              {selectedTransaction.transaction_details.payment_intent_id}
                            </Text>
                          </HStack>
                        )}
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Payment Recorded:</Text>
                          <Text fontSize="sm">
                            {new Date(
                              selectedTransaction.transaction_details.created_at
                            ).toLocaleString()}
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>
                  </VStack>
                )}
              </DialogBody>
              <DialogFooter>
                <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </DialogRoot>

          {/* Transactions Table */}
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
                  <Table.ColumnHeader>Product</Table.ColumnHeader>
                  <Table.ColumnHeader>Quantity</Table.ColumnHeader>
                  <Table.ColumnHeader>Type</Table.ColumnHeader>
                  <Table.ColumnHeader>Payment</Table.ColumnHeader>
                  <Table.ColumnHeader>Amount</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Date</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {transactions.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={9} textAlign="center" py={8}>
                      <Text color="gray.500">No transactions found</Text>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  transactions.map((transaction) => (
                    <Table.Row
                      key={transaction.id}
                      _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                    >
                      <Table.Cell>
                        <VStack align="start" gap={0}>
                          <Text fontWeight="medium">{transaction.product.name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {transaction.product.location}
                          </Text>
                        </VStack>
                      </Table.Cell>
                      <Table.Cell>{transaction.quantity}</Table.Cell>
                      <Table.Cell>
                        <Badge colorScheme="blue">{transaction.transaction_type}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorScheme={getPaymentMethodBadge(transaction.payment_method)}>
                          {transaction.payment_method}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontWeight="bold">
                        ₱{transaction.total_amount.toFixed(2)}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorScheme={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="sm">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </Table.Cell>
                      <Table.Cell>
                        <HStack gap={2} justify="center">
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="blue"
                            onClick={() => handleViewDetails(transaction)}
                          >
                            <FiEye />
                            View Details
                          </Button>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        </VStack>
      </Box>
    </>
  );
}
