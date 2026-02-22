'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Box,
  Button,
  Card,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Field } from '@svm/components/field';
import { PasswordInput } from '@svm/components/password-input';

type LoginResponse = {
  token: string;
  student: {
    id: number;
    name: string;
    rfid: string;
    load: number;
    created_at: string;
    updated_at: string;
  };
};

export default function StudentLoginPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';

  const [rfid, setRfid] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/students/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rfid, pin }),
      });

      const data = (await response.json().catch(() => ({}))) as Partial<LoginResponse> & {
        error?: string;
      };

      if (!response.ok || !data.token) {
        setError(data.error || 'Login failed. Please check your RFID and PIN.');
        return;
      }

      if (data.student?.rfid) {
        localStorage.setItem('student_rfid', data.student.rfid);
      }
      setSuccess('Login successful. Redirecting...');
      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Card.Root maxW="md" w="full">
        <Card.Header>
          <Box display="flex" justifyContent="center" mb={4}>
            <Image src="/logo.jpg" alt="SVM Logo" width={96} height={96} priority />
          </Box>
          <Heading size="xl" textAlign="center">
            Student Login
          </Heading>
          <Text color="fg.muted" textAlign="center" mt={2}>
            Sign in using your RFID and PIN
          </Text>
        </Card.Header>

        <Card.Body>
          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Field label="RFID" required>
                <Input
                  type="text"
                  value={rfid}
                  onChange={(event) => setRfid(event.target.value)}
                  placeholder="Enter your RFID"
                  required
                />
              </Field>

              <Field label="PIN" required>
                <PasswordInput
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="Enter your PIN"
                  required
                />
              </Field>

              {error && (
                <Text color="red.500" fontSize="sm">
                  {error}
                </Text>
              )}

              {success && (
                <Text color="green.500" fontSize="sm">
                  {success}
                </Text>
              )}

              <Button type="submit" w="full" loading={loading}>
                Login
              </Button>
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}