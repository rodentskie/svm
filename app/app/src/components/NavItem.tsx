import { Flex, Box, Text, AbsoluteCenter, Center } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  isCollapsed: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export function NavItem({
  icon,
  label,
  isCollapsed,
  isActive = false,
  onClick,
}: NavItemProps) {
  return (
    <Flex
      alignItems="center"
      gap={3}
      p={3}
      borderRadius="md"
      cursor="pointer"
      bg={isActive ? 'green.100' : undefined}
      _dark={{ bg: isActive ? 'green.900' : undefined }}
      _hover={{ bg: isActive ? 'green.100' : 'bg.muted', _dark: { bg: isActive ? 'green.900' : undefined } }}
      justifyContent={isCollapsed ? 'center' : 'flex-start'}
      color={isActive ? 'green.700' : undefined}
      _dark={{ color: isActive ? 'green.300' : undefined }}
      onClick={onClick}
    >
      <Center>
        <Box fontSize="20px">{icon}</Box>
      </Center>
      <Text display={{ base: 'none', md: isCollapsed ? 'none' : 'block' }}>
        {label}
      </Text>
    </Flex>
  );
}
