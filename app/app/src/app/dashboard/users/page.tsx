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
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      const response = await fetch(`${apiUrl}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'red';
      case 'operator':
        return 'blue';
      default:
        return 'gray';
    }
  };

  if (isLoading) {
    return (
      <Box p={8} display="flex" justifyContent="center" alignItems="center" minH="400px">
        <VStack gap={4}>
          <Spinner size="xl" />
          <Text>Loading users...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={8}>
        <Text color="red.500">Error: {error}</Text>
        <Button mt={4} onClick={fetchUsers}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={8}>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">Users Management</Heading>
          <Button colorScheme="blue">
            <FiPlus />
            Add New User
          </Button>
        </HStack>

        {/* Users Table */}
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
                <Table.ColumnHeader>Username</Table.ColumnHeader>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader>Phone</Table.ColumnHeader>
                <Table.ColumnHeader>Role</Table.ColumnHeader>
                <Table.ColumnHeader>Created At</Table.ColumnHeader>
                <Table.ColumnHeader>Updated At</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="center">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={8} textAlign="center" py={8}>
                    <Text color="gray.500">No users found</Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                users.map((user) => (
                  <Table.Row key={user.id} _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}>
                    <Table.Cell>{user.username}</Table.Cell>
                    <Table.Cell>{user.name}</Table.Cell>
                    <Table.Cell>{user.email}</Table.Cell>
                    <Table.Cell>{user.phone}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={getRoleBadgeColor(user.role)}>
                        {user.role.toUpperCase()}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell fontSize="sm">{user.created_at}</Table.Cell>
                    <Table.Cell fontSize="sm">{user.updated_at}</Table.Cell>
                    <Table.Cell>
                      <HStack gap={2} justify="center">
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                        >
                          <FiEdit2 />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="red"
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
        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
          Total Users: {users.length}
        </Text>
      </VStack>
    </Box>
  );
}
