import { Box, Card, Heading, Text } from '@chakra-ui/react';

export default function DashboardPage() {
  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Heading mb={4}>Dashboard</Heading>
      <Text>Welcome to your dashboard!</Text>
    </Box>
  );
}
