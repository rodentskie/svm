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
      bg={isActive ? 'bg.muted' : undefined}
      _hover={{ bg: 'bg.muted' }}
      justifyContent={isCollapsed ? 'center' : 'flex-start'}
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
