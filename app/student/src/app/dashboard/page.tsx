'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  IconButton,
  Popover,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { ColorModeButton } from '@svm/components/color-mode';
import {
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from '@svm/components/dialog';
import { PopoverContent } from '@svm/components/popover';
import { LuBell, LuCheck, LuLogOut } from 'react-icons/lu';

type StudentTransaction = {
  id: number;
  student_id: number;
  load: number;
  type: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
};

type StudentDataResponse = {
  current_load: number;
  data: StudentTransaction[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};

const DEFAULT_LIMIT = 10;

export default function StudentDashboardPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';

  const [rfid, setRfid] = useState('');
  const [currentLoad, setCurrentLoad] = useState(0);
  const [transactions, setTransactions] = useState<StudentTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedRfid = localStorage.getItem('student_rfid');
    if (!storedRfid) {
      router.push('/');
      return;
    }
    setRfid(storedRfid);
  }, [router]);

  const hasMore = useMemo(
    () => transactions.length < total,
    [transactions.length, total],
  );
  const unreadCount = useMemo(
    () => transactions.filter((transaction) => !transaction.is_read).length,
    [transactions],
  );

  const fetchData = useCallback(
    async (offset: number, append: boolean) => {
      if (!rfid) return;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        setError('');
        const token =
          typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
          `${apiUrl}/students/data?rfid=${encodeURIComponent(rfid)}&limit=${DEFAULT_LIMIT}&offset=${offset}`,
          { headers },
        );

        const result = (await response
          .json()
          .catch(() => ({}))) as Partial<StudentDataResponse> & {
          error?: string;
        };

        if (!response.ok) {
          setError(result.error || 'Failed to fetch student data.');
          return;
        }

        const nextRows = result.data || [];
        setCurrentLoad(result.current_load || 0);
        setTotal(result.pagination?.total || 0);

        if (append) {
          setTransactions((prev) => [...prev, ...nextRows]);
        } else {
          setTransactions(nextRows);
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [apiUrl, rfid],
  );

  const markTransactionAsRead = async (transactionId: number) => {
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/students/data/${transactionId}`, {
        method: 'PATCH',
        headers,
      });

      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to mark transaction as read');
      }

      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === transactionId
            ? { ...transaction, is_read: true }
            : transaction,
        ),
      );
    } catch {
      setError('Failed to mark transaction as read.');
    }
  };

  const markAllVisibleUnreadAsRead = async () => {
    const unreadItems = transactions.filter(
      (transaction) => !transaction.is_read,
    );
    if (unreadItems.length === 0 || markingRead) return;

    setMarkingRead(true);
    try {
      await Promise.all(
        unreadItems.map((transaction) => markTransactionAsRead(transaction.id)),
      );
    } catch {
      setError('Failed to mark notifications as read.');
    } finally {
      setMarkingRead(false);
    }
  };

  const handleConfirmLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('student_rfid');
    }
    setIsLogoutDialogOpen(false);
    router.push('/');
  };

  useEffect(() => {
    fetchData(0, false);
  }, [fetchData]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !loadingMore && !loading && hasMore) {
          fetchData(transactions.length, true);
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchData, hasMore, loading, loadingMore, transactions.length]);

  return (
    <Box minH="100vh" bg="bg.subtle">
      <Flex
        as="header"
        position="sticky"
        top={0}
        zIndex={10}
        h="16"
        bg="bg"
        borderBottomWidth="1px"
        alignItems="center"
        justifyContent="space-between"
        px={4}
      >
        <Heading size="md">Student Dashboard</Heading>
        <HStack gap={2}>
          <ColorModeButton />
          <IconButton
            aria-label="Logout"
            variant="ghost"
            size="sm"
            onClick={() => setIsLogoutDialogOpen(true)}
          >
            <LuLogOut />
          </IconButton>
          <Popover.Root
            open={popoverOpen}
            onOpenChange={(details) => setPopoverOpen(details.open)}
          >
            <Popover.Trigger asChild>
              <Box position="relative" onClick={() => setPopoverOpen(true)}>
                <IconButton
                  aria-label="Notifications"
                  variant="ghost"
                  size="sm"
                >
                  <LuBell />
                </IconButton>
                <Badge
                  position="absolute"
                  top="-1"
                  right="-1"
                  colorPalette="red"
                  borderRadius="full"
                  minW="5"
                  textAlign="center"
                  px="1"
                >
                  {unreadCount}
                </Badge>
              </Box>
            </Popover.Trigger>
            <PopoverContent onMouseLeave={() => setPopoverOpen(false)} p={2} boxSize={'12'}>
              <Box display="flex" justifyContent="center">
                <IconButton
                  size="xs"
                  colorPalette="green"
                  aria-label="Mark all as read"
                  onClick={() => {
                    markAllVisibleUnreadAsRead();
                    setPopoverOpen(false);
                  }}
                  loading={markingRead}
                >
                  <LuCheck />
                </IconButton>
              </Box>
            </PopoverContent>
          </Popover.Root>
        </HStack>
      </Flex>

      <Box maxW="xl" mx="auto" px={4} py={6}>
        <Card.Root mb={4}>
          <Card.Body>
            <Text color="fg.muted" fontSize="sm">
              Current Running Balance
            </Text>
            <Heading size="2xl" mt={2}>
              ₱ {currentLoad.toFixed(2)}
            </Heading>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Heading size="md">Transactions</Heading>
            <Text color="fg.muted" fontSize="sm">
              RFID: {rfid}
            </Text>
          </Card.Header>
          <Card.Body>
            <Stack gap={3}>
              {loading ? (
                <Flex justify="center" py={8}>
                  <Spinner size="md" />
                </Flex>
              ) : transactions.length === 0 ? (
                <Text color="fg.muted">No transactions found.</Text>
              ) : (
                transactions.map((transaction) => (
                  <Box
                    key={transaction.id}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    bg={transaction.is_read ? 'transparent' : 'yellow.50'}
                    _dark={{
                      bg: transaction.is_read ? 'transparent' : 'yellow.900/20',
                    }}
                    onClick={() =>
                      !transaction.is_read &&
                      markTransactionAsRead(transaction.id)
                    }
                    cursor={transaction.is_read ? 'default' : 'pointer'}
                    _hover={transaction.is_read ? {} : { opacity: 0.8 }}
                  >
                    <Flex justify="space-between" align="start" gap={3}>
                      <Box>
                        <Text fontWeight="semibold" textTransform="capitalize">
                          {transaction.type}
                        </Text>
                        <Text color="fg.muted" fontSize="sm">
                          {new Date(transaction.created_at).toLocaleString()}
                        </Text>
                      </Box>
                      <HStack gap={2}>
                        {!transaction.is_read && (
                          <Badge colorPalette="green">New</Badge>
                        )}
                        <Text fontWeight="bold">
                          ₱ {Number(transaction.load).toFixed(2)}
                        </Text>
                      </HStack>
                    </Flex>
                  </Box>
                ))
              )}

              {error && (
                <Text color="red.500" fontSize="sm">
                  {error}
                </Text>
              )}

              {loadingMore && (
                <Flex justify="center" py={3}>
                  <Spinner size="sm" />
                </Flex>
              )}

              <Box ref={sentinelRef} h="1px" />
            </Stack>
          </Card.Body>
        </Card.Root>
      </Box>

      <DialogRoot
        open={isLogoutDialogOpen}
        onOpenChange={(details) => setIsLogoutDialogOpen(details.open)}
      >
        <DialogBackdrop />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text>Are you sure you want to logout?</Text>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button colorPalette="red" onClick={handleConfirmLogout}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}
