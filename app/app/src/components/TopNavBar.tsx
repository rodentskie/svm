import { Flex, HStack } from '@chakra-ui/react';
import { Avatar } from '@svm/components/avatar';
import { ColorModeButton } from '@svm/components/color-mode';
import { GoogleLogo } from './GoogleLogo';

interface TopNavBarProps {
  userName?: string;
  userAvatar?: string;
}

export function TopNavBar({ userName = 'User Name', userAvatar }: TopNavBarProps) {
  return (
    <Flex
      as="header"
      position="fixed"
      top={0}
      left={0}
      right={0}
      h="16"
      bg="bg"
      borderBottomWidth="1px"
      alignItems="center"
      justifyContent="space-between"
      px={4}
      zIndex={10}
    >
      {/* Left: Logo */}
      <Flex alignItems="center" gap={2}>
        <GoogleLogo />
      </Flex>

      {/* Right: Dark/Light Mode & Avatar */}
      <HStack gap={2}>
        <ColorModeButton />
        <Avatar name={userName} src={userAvatar} size="sm" />
      </HStack>
    </Flex>
  );
}
