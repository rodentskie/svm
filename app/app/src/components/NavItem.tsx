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
      bg={isActive ? 'green.600' : undefined}
      _dark={{ bg: isActive ? 'green.700' : undefined }}
      _hover={{
        bg: isActive ? 'green.700' : 'bg.muted',
        _dark: { bg: isActive ? 'green.800' : undefined },
      }}
      justifyContent={isCollapsed ? 'center' : 'flex-start'}
      color={isActive ? 'white' : undefined}
      fontWeight={isActive ? 'bold' : 'normal'}
      transition="all 0.2s"
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
