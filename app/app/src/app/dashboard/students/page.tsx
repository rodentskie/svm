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
  Input,
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi';
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

interface Student {
  id: number;
  name: string;
  rfid: string;
  load: number;
  created_at: string;
  updated_at: string;
}

interface CreateStudentForm {
  name: string;
  RFID: string;
  load: string;
}

interface UpdateStudentForm {
  name: string;
  RFID: string;
}

interface AddLoadForm {
  load: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddLoadDialogOpen, setIsAddLoadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loadingStudent, setLoadingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [createFormData, setCreateFormData] = useState<CreateStudentForm>({
    name: '',
    RFID: '',
    load: '0',
  });
  const [updateFormData, setUpdateFormData] = useState<UpdateStudentForm>({
    name: '',
    RFID: '',
  });
  const [addLoadFormData, setAddLoadFormData] = useState<AddLoadForm>({
    load: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      const response = await fetch(`${apiUrl}/students`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInputChange = (field: keyof CreateStudentForm, value: string) => {
    setCreateFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateInputChange = (field: keyof UpdateStudentForm, value: string) => {
    setUpdateFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddLoadInputChange = (value: string) => {
    setAddLoadFormData({ load: value });
  };

  const resetCreateForm = () => {
    setCreateFormData({
      name: '',
      RFID: '',
      load: '0',
    });
  };

  const resetUpdateForm = () => {
    setUpdateFormData({
      name: '',
      RFID: '',
    });
  };

  const resetAddLoadForm = () => {
    setAddLoadFormData({
      load: '',
    });
  };

  const handleCreateStudent = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      const response = await fetch(`${apiUrl}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createFormData.name,
          RFID: createFormData.RFID,
          load: parseFloat(createFormData.load),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create student');
      }

      toaster.create({
        title: 'Success',
        description: 'Student created successfully',
        type: 'success',
        duration: 3000,
      });

      setIsDialogOpen(false);
      resetCreateForm();
      fetchStudents();
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create student',
        type: 'error',
        duration: 3000,
      });
      console.error('Error creating student:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setUpdateFormData({
      name: student.name,
      RFID: student.rfid,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      const response = await fetch(`${apiUrl}/students/${editingStudent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update student');
      }

      toaster.create({
        title: 'Success',
        description: 'Student updated successfully',
        type: 'success',
        duration: 3000,
      });

      setIsEditDialogOpen(false);
      setEditingStudent(null);
      resetUpdateForm();
      fetchStudents();
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update student',
        type: 'error',
        duration: 3000,
      });
      console.error('Error updating student:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLoadClick = (student: Student) => {
    setLoadingStudent(student);
    resetAddLoadForm();
    setIsAddLoadDialogOpen(true);
  };

  const handleAddLoad = async () => {
    if (!loadingStudent) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      const response = await fetch(`${apiUrl}/students/${loadingStudent.id}/load`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          load: parseFloat(addLoadFormData.load),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add load');
      }

      toaster.create({
        title: 'Success',
        description: 'Load added successfully',
        type: 'success',
        duration: 3000,
      });

      setIsAddLoadDialogOpen(false);
      setLoadingStudent(null);
      resetAddLoadForm();
      fetchStudents();
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add load',
        type: 'error',
        duration: 3000,
      });
      console.error('Error adding load:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (student: Student) => {
    setDeletingStudent(student);
    setDeleteConfirmText('');
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

      const response = await fetch(`${apiUrl}/students/${deletingStudent.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete student');
      }

      toaster.create({
        title: 'Success',
        description: 'Student deleted successfully',
        type: 'success',
        duration: 3000,
      });

      setIsDeleteDialogOpen(false);
      setDeletingStudent(null);
      setDeleteConfirmText('');
      fetchStudents();
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete student',
        type: 'error',
        duration: 3000,
      });
      console.error('Error deleting student:', err);
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
            <Text>Loading students...</Text>
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
          <Button mt={4} onClick={fetchStudents}>
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
            <Heading size="lg" color="green.600" _dark={{ color: "green.400" }}>Students Management</Heading>
            <Button colorPalette="green" onClick={() => setIsDialogOpen(true)}>
              <FiPlus />
              Add New Student
            </Button>
          </HStack>

          {/* Create Student Dialog */}
          <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
            <DialogBackdrop />
            <DialogContent>
              <DialogHeader>
                <DialogTitle color="green.600" _dark={{ color: "green.400" }}>Add New Student</DialogTitle>
              </DialogHeader>
              <DialogCloseTrigger />
              <DialogBody>
                <VStack gap={4}>
                  <Field label="Name" required>
                    <Input
                      placeholder="Enter student name"
                      value={createFormData.name}
                      onChange={(e) => handleCreateInputChange('name', e.target.value)}
                    />
                  </Field>

                  <Field label="RFID" required>
                    <Input
                      placeholder="Enter RFID"
                      value={createFormData.RFID}
                      onChange={(e) => handleCreateInputChange('RFID', e.target.value)}
                    />
                  </Field>

                  <Field label="Initial Load" required>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter initial load"
                      value={createFormData.load}
                      onChange={(e) => handleCreateInputChange('load', e.target.value)}
                    />
                  </Field>
                </VStack>
              </DialogBody>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetCreateForm();
                  }}
                >
                  Cancel
                </Button>
                <Button colorPalette="green" onClick={handleCreateStudent} loading={isSubmitting}>
                  Create Student
                </Button>
              </DialogFooter>
            </DialogContent>
          </DialogRoot>

          {/* Edit Student Dialog */}
          <DialogRoot open={isEditDialogOpen} onOpenChange={(e) => setIsEditDialogOpen(e.open)}>
            <DialogBackdrop />
            <DialogContent>
              <DialogHeader>
                <DialogTitle color="green.600" _dark={{ color: "green.400" }}>Edit Student</DialogTitle>
              </DialogHeader>
              <DialogCloseTrigger />
              <DialogBody>
                <VStack gap={4}>
                  <Field label="Name" required>
                    <Input
                      placeholder="Enter student name"
                      value={updateFormData.name}
                      onChange={(e) => handleUpdateInputChange('name', e.target.value)}
                    />
                  </Field>

                  <Field label="RFID" required>
                    <Input
                      placeholder="Enter RFID"
                      value={updateFormData.RFID}
                      onChange={(e) => handleUpdateInputChange('RFID', e.target.value)}
                    />
                  </Field>
                </VStack>
              </DialogBody>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingStudent(null);
                    resetUpdateForm();
                  }}
                >
                  Cancel
                </Button>
                <Button colorPalette="green" onClick={handleUpdateStudent} loading={isSubmitting}>
                  Update Student
                </Button>
              </DialogFooter>
            </DialogContent>
          </DialogRoot>

          {/* Add Load Dialog */}
          <DialogRoot open={isAddLoadDialogOpen} onOpenChange={(e) => setIsAddLoadDialogOpen(e.open)}>
            <DialogBackdrop />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Load to {loadingStudent?.name}</DialogTitle>
              </DialogHeader>
              <DialogCloseTrigger />
              <DialogBody>
                <VStack gap={4}>
                  <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                    Current Load: ₱{loadingStudent?.load.toFixed(2)}
                  </Text>
                  <Field label="Amount to Add" required>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount to add"
                      value={addLoadFormData.load}
                      onChange={(e) => handleAddLoadInputChange(e.target.value)}
                    />
                  </Field>
                </VStack>
              </DialogBody>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddLoadDialogOpen(false);
                    setLoadingStudent(null);
                    resetAddLoadForm();
                  }}
                >
                  Cancel
                </Button>
                <Button colorPalette="green" onClick={handleAddLoad} loading={isSubmitting}>
                  Add Load
                </Button>
              </DialogFooter>
            </DialogContent>
          </DialogRoot>

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => {
              setIsDeleteDialogOpen(false);
              setDeletingStudent(null);
              setDeleteConfirmText('');
            }}
            onConfirm={handleDeleteStudent}
            isSubmitting={isSubmitting}
            itemName={deletingStudent?.name || ''}
            itemType="Student"
            confirmText={deleteConfirmText}
            onConfirmTextChange={setDeleteConfirmText}
          />

          {/* Students Table */}
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
                  <Table.ColumnHeader>Name</Table.ColumnHeader>
                  <Table.ColumnHeader>RFID</Table.ColumnHeader>
                  <Table.ColumnHeader>Load</Table.ColumnHeader>
                  <Table.ColumnHeader>Last Updated</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {students.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={6} textAlign="center" py={8}>
                      <Text color="gray.500">No students found</Text>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  students.map((student) => (
                    <Table.Row key={student.id} _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}>
                      <Table.Cell fontWeight="medium">{student.name}</Table.Cell>
                      <Table.Cell>{student.rfid}</Table.Cell>
                      <Table.Cell>₱{student.load.toFixed(2)}</Table.Cell>
                      <Table.Cell fontSize="sm">{student.updated_at}</Table.Cell>
                      <Table.Cell>
                        <HStack gap={2} justify="center">
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="green"
                            onClick={() => handleAddLoadClick(student)}
                          >
                            <FiDollarSign />
                            Add Load
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="green"
                            onClick={() => handleEditClick(student)}
                          >
                            <FiEdit2 />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="red"
                            onClick={() => handleDeleteClick(student)}
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
            Total Students: {students.length}
          </Text>
        </VStack>
      </Box>
    </>
  );
}
