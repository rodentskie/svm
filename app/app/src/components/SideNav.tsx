'use client';

import { Box, Flex, IconButton, VStack } from '@chakra-ui/react';
import {
  FiMenu,
  FiX,
  FiUsers,
  FiShoppingCart,
  FiPackage,
  FiUserCheck,
} from 'react-icons/fi';
import { NavItem } from './NavItem';

interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface SideNavProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeItem?: string;
  onNavigate?: (itemId: string) => void;
  navItems?: NavItemConfig[];
}

const defaultNavItems: NavItemConfig[] = [
  { id: 'users', label: 'Users', icon: <FiUsers />, path: '/users' },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: <FiShoppingCart />,
    path: '/transactions',
  },
  { id: 'products', label: 'Products', icon: <FiPackage />, path: '/products' },
  {
    id: 'students',
    label: 'Students',
    icon: <FiUserCheck />,
    path: '/students',
  },
];

export function SideNav({
  isCollapsed,
  onToggle,
  activeItem,
  onNavigate,
  navItems = defaultNavItems,
}: SideNavProps) {
  return (
    <Box
      as="nav"
      position="fixed"
      left={0}
      top="16"
      bottom={0}
      w={{
        base: '16',
        md: isCollapsed ? '16' : '64',
      }}
      bg="bg"
      borderRightWidth="1px"
      transition="width 0.2s"
      zIndex={9}
    >
      <VStack align="stretch" p={2} gap={4}>
        {/* Toggle Button - Hidden on mobile */}
        <Flex
          justify={isCollapsed ? 'center' : 'flex-end'}
          display={{ base: 'none', md: 'flex' }}
        >
          <IconButton
            aria-label="Toggle sidebar"
            size="sm"
            variant="ghost"
            onClick={onToggle}
          >
            {isCollapsed ? <FiMenu /> : <FiX />}
          </IconButton>
        </Flex>

        {/* Navigation Items */}
        <VStack align="stretch" gap={1}>
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isCollapsed={isCollapsed}
              isActive={activeItem === item.id}
              onClick={() => onNavigate?.(item.id)}
            />
          ))}
        </VStack>
      </VStack>
    </Box>
  );
}
