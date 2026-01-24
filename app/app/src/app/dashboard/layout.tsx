'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Heading, Text } from '@chakra-ui/react';
import { TopNavBar } from '../../components/TopNavBar';
import { SideNav } from '../../components/SideNav';

export default function DashboardPage(props: { children: React.ReactNode }) {
  const { children } = props;
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<string>();

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleNavigate = (itemId: string) => {
    setActiveItem(itemId);
    router.push(`/dashboard/${itemId}`);
    // Add navigation logic here, e.g., router.push(`/${itemId}`)
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <Box minH="100vh" bg="bg.muted">
      <TopNavBar userName="User Name" />

      <SideNav
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        activeItem={activeItem}
        onNavigate={handleNavigate}
      />

      {/* Main Content */}
      <Box
        ml={{
          base: '16',
          md: isCollapsed ? '16' : '64',
        }}
        mt="16"
        p={8}
        transition="margin-left 0.2s"
      >
        {children}
      </Box>
    </Box>
  );
}
