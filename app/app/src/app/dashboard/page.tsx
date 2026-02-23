'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  Grid,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { Chart, useChart } from '@chakra-ui/charts';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AnalyticsOverview {
  rfid_buyer_count: number;
  total_revenue: number;
  total_students: number;
  total_transactions: number;
}

interface TransactionPoint {
  date: string;
  transaction_count: number;
  total_amount: number;
  total_quantity: number;
}

interface TransactionHistoryPoint {
  date: string;
  load_count: number;
  purchase_count: number;
  refund_count: number;
  payment_count: number;
  load_amount: number;
  purchase_amount: number;
  refund_amount: number;
  payment_amount: number;
}

interface TopRFIDBuyer {
  student_id: number | null;
  student_name: string | null;
  rfid: string;
  purchase_count: number;
  total_spent: number;
  total_quantity: number;
  last_purchase: string | null;
}

interface DashboardAnalyticsResponse {
  overview: AnalyticsOverview;
  period: {
    days: number;
    start: string;
    end: string;
  };
  top_rfid_buyers: TopRFIDBuyer[];
  transaction_history: TransactionHistoryPoint[];
  transactions: TransactionPoint[];
}

export default function DashboardPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [daysInput, setDaysInput] = useState('7');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${apiUrl}/dashboard/analytics?days=${days}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          router.push('/');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard analytics');
        }

        const result = (await response.json()) as DashboardAnalyticsResponse;
        setAnalytics(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load dashboard analytics'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [apiUrl, days, router]);

  const topBuyerChartData = useMemo(
    () =>
      (analytics?.top_rfid_buyers || []).map((buyer) => ({
        label: buyer.student_name || buyer.rfid || 'Unknown',
        purchase_count: buyer.purchase_count,
        total_spent: buyer.total_spent,
      })),
    [analytics?.top_rfid_buyers]
  );

  const transactionsChart = useChart({
    data: analytics?.transactions || [],
    series: [
      { name: 'transaction_count', label: 'Transactions', color: 'teal.500' },
    ],
  });

  const historyChart = useChart({
    data: analytics?.transaction_history || [],
    series: [
      {
        name: 'purchase_amount',
        label: 'Purchase Amount',
        color: 'blue.500',
      },
    ],
  });

  const topBuyersChart = useChart({
    data: topBuyerChartData,
    series: [{ name: 'purchase_count', label: 'Purchases', color: 'purple.500' }],
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="40vh">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box>
        <Text color="fg.muted">No dashboard data available.</Text>
      </Box>
    );
  }

  const applyDaysFilter = () => {
    const parsed = Number(daysInput);
    if (!Number.isFinite(parsed)) {
      setDaysInput(String(days));
      return;
    }

    const clamped = Math.min(10, Math.max(1, Math.floor(parsed)));
    setDays(clamped);
    setDaysInput(String(clamped));
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6} align="start">
        <Box>
          <Heading size="lg">Dashboard</Heading>
          <Text color="fg.muted">
            {analytics.period.start} to {analytics.period.end}
          </Text>
        </Box>

        <HStack>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={10}
            w="20"
            value={daysInput}
            onChange={(e) => setDaysInput(e.target.value)}
            onBlur={applyDaysFilter}
          />
          <Button onClick={applyDaysFilter} size="sm" colorPalette={'green'}>
            Apply
          </Button>
        </HStack>
      </HStack>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4} mb={6}>
        <Card.Root>
          <Card.Body>
            <Text color="fg.muted" fontSize="sm">
              Total Revenue
            </Text>
            <Heading size="md">
              ₱{analytics.overview.total_revenue.toLocaleString()}
            </Heading>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text color="fg.muted" fontSize="sm">
              Total Transactions
            </Text>
            <Heading size="md">
              {analytics.overview.total_transactions.toLocaleString()}
            </Heading>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text color="fg.muted" fontSize="sm">
              RFID Buyers
            </Text>
            <Heading size="md">
              {analytics.overview.rfid_buyer_count.toLocaleString()}
            </Heading>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text color="fg.muted" fontSize="sm">
              Students
            </Text>
            <Heading size="md">
              {analytics.overview.total_students.toLocaleString()}
            </Heading>
          </Card.Body>
        </Card.Root>
      </Grid>

      <Grid templateColumns={{ base: '1fr', xl: 'repeat(2, 1fr)' }} gap={6}>
        <Card.Root>
          <Card.Header>
            <Heading size="sm">Transactions Trend</Heading>
          </Card.Header>
          <Card.Body>
            <Chart.Root chart={transactionsChart} h="300px" w="full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={transactionsChart.data}>
                  <CartesianGrid
                    stroke={transactionsChart.color('border.muted')}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={transactionsChart.formatDate({
                      month: 'short',
                      day: '2-digit',
                    })}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey={transactionsChart.key('transaction_count')}
                    stroke={transactionsChart.color('teal.500')}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Chart.Root>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Heading size="sm">Transaction History (Purchase Amount)</Heading>
          </Card.Header>
          <Card.Body>
            <Chart.Root chart={historyChart} h="300px" w="full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyChart.data}>
                  <CartesianGrid
                    stroke={historyChart.color('border.muted')}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={historyChart.formatDate({
                      month: 'short',
                      day: '2-digit',
                    })}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar
                    dataKey={historyChart.key('purchase_amount')}
                    fill={historyChart.color('blue.500')}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Chart.Root>
          </Card.Body>
        </Card.Root>

        <Card.Root gridColumn={{ base: '1', xl: '1 / span 2' }}>
          <Card.Header>
            <Heading size="sm">Top RFID Buyers (By Purchase Count)</Heading>
          </Card.Header>
          <Card.Body>
            {topBuyerChartData.length === 0 ? (
              <Text color="fg.muted">No RFID buyer data found for this period.</Text>
            ) : (
              <Chart.Root chart={topBuyersChart} h="340px" w="full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topBuyersChart.data}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid
                      stroke={topBuyersChart.color('border.muted')}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={140}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey={topBuyersChart.key('purchase_count')}
                      fill={topBuyersChart.color('purple.500')}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Chart.Root>
            )}
          </Card.Body>
        </Card.Root>
      </Grid>
    </Box>
  );
}
