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
import { toaster,Toaster } from '@svm/components/toaster';
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
import { NativeSelectRoot, NativeSelectField } from '@svm/components/native-select';
import { PasswordInput } from '@svm/components/password-input';

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

interface CreateUserForm {
  username: string;
  password: string;
  re_enter_password: string;
  email: string;
  name: string;
  phone: string;
  role: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [formData, setFormData] = useState<CreateUserForm>({
    username: '',
    password: '',
    re_enter_password: '',
    email: '',
    name: '',
    phone: '',
    role: 'operator',
  });

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

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      re_enter_password: '',
      email: '',
      name: '',
      phone: '',
      role: 'operator',
    });
  };

  const handleCreateUser = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      // data validation on api
      // display error message from api
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      toaster.create({
        title: 'Success',
        description: 'User created successfully',
        type: 'success',
        duration: 3000,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchUsers(); // Refresh the list
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create user',
        type: 'error',
        duration: 3000,
      });
      console.error('Error creating user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      re_enter_password: '',
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      const response = await fetch(`${apiUrl}/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      toaster.create({
        title: 'Success',
        description: 'User updated successfully',
        type: 'success',
        duration: 3000,
      });
      
      setIsEditDialogOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers(); // Refresh the list
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update user',
        type: 'error',
        duration: 3000,
      });
      console.error('Error updating user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setDeletingUser(user);
    setDeleteConfirmText('');
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      const response = await fetch(`${apiUrl}/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      toaster.create({
        title: 'Success',
        description: 'User deleted successfully',
        type: 'success',
        duration: 3000,
      });
      
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
      setDeleteConfirmText('');
      fetchUsers(); // Refresh the list
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete user',
        type: 'error',
        duration: 3000,
      });
      console.error('Error deleting user:', err);
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
            <Text>Loading users...</Text>
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
          <Button mt={4} onClick={fetchUsers}>
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
          <Heading size="lg">Users Management</Heading>
          <Button colorScheme="blue" onClick={() => setIsDialogOpen(true)}>
            <FiPlus />
            Add New User
          </Button>
        </HStack>

        {/* Create User Dialog */}
        <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
          <DialogBackdrop />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <DialogCloseTrigger />
            <DialogBody>
              <VStack gap={4}>
                <Field label="Username" required>
                  <Input
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                  />
                </Field>

                <Field label="Full Name" required>
                  <Input
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </Field>

                <Field label="Email" required>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </Field>

                <Field label="Phone" required>
                  <Input
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </Field>

                <Field label="Role" required>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                    >
                      <option value="operator">Operator</option>
                      <option value="admin">Admin</option>
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Field>

                <Field label="Password" required>
                  <PasswordInput
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </Field>

                <Field label="Re-enter Password" required>
                  <PasswordInput
                    placeholder="Re-enter password"
                    value={formData.re_enter_password}
                    onChange={(e) => handleInputChange('re_enter_password', e.target.value)}
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
              <Button
                colorScheme="blue"
                onClick={handleCreateUser}
                loading={isSubmitting}
              >
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>

        {/* Delete Confirmation Dialog */}
        <DialogRoot open={isDeleteDialogOpen} onOpenChange={(e) => setIsDeleteDialogOpen(e.open)}>
          <DialogBackdrop />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
            </DialogHeader>
            <DialogCloseTrigger />
            <DialogBody>
              <VStack gap={4} align="stretch">
                <Text>
                  Are you sure you want to delete user <strong>{deletingUser?.username}</strong>?
                </Text>
                <Text color="red.600" _dark={{ color: 'red.400' }} fontSize="sm">
                  This action cannot be undone.
                </Text>
                <Field 
                  label='Type "delete" to confirm' 
                  required
                >
                  <Input
                    placeholder='Type "delete" to confirm'
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                  />
                </Field>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingUser(null);
                  setDeleteConfirmText('');
                }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteUser}
                loading={isSubmitting}
                disabled={deleteConfirmText !== 'delete'}
              >
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>

        {/* Edit User Dialog */}
        <DialogRoot open={isEditDialogOpen} onOpenChange={(e) => setIsEditDialogOpen(e.open)}>
          <DialogBackdrop />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <DialogCloseTrigger />
            <DialogBody>
              <VStack gap={4}>
                <Field label="Username" required>
                  <Input
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                  />
                </Field>

                <Field label="Full Name" required>
                  <Input
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </Field>

                <Field label="Email" required>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </Field>

                <Field label="Phone" required>
                  <Input
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </Field>

                <Field label="Role" required>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                    >
                      <option value="operator">Operator</option>
                      <option value="admin">Admin</option>
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Field>

                <Field label="Password" required>
                  <PasswordInput
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </Field>

                <Field label="Re-enter Password" required>
                  <PasswordInput
                    placeholder="Re-enter new password"
                    value={formData.re_enter_password}
                    onChange={(e) => handleInputChange('re_enter_password', e.target.value)}
                  />
                </Field>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingUser(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleUpdateUser}
                loading={isSubmitting}
              >
                Update User
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>

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
                <Table.ColumnHeader>Last Updated</Table.ColumnHeader>
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
                    <Table.Cell fontSize="sm">{user.updated_at}</Table.Cell>
                    <Table.Cell>
                      <HStack gap={2} justify="center">
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          onClick={() => handleEditClick(user)}
                        >
                          <FiEdit2 />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="red"
                          onClick={() => handleDeleteClick(user)}
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
    </>
  );
}
