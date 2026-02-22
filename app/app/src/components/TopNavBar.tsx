import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Popover,
  Portal,
  Text,
} from '@chakra-ui/react';
import { Avatar } from '@svm/components/avatar';
import { ColorModeButton } from '@svm/components/color-mode';
import { VendingMachineLogo } from './VendingMachineLogo';

interface TopNavBarProps {
  userName?: string;
  userAvatar?: string;
  onLogout?: () => void;
}

export function TopNavBar({
  userName = 'User Name',
  userAvatar,
  onLogout,
}: TopNavBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);

  const handleOpenChange = (details: { open: boolean }) => {
    setIsOpen(details.open);
    if (!details.open) {
      setIsConfirmingLogout(false);
    }
  };

  const handleConfirmLogout = () => {
    setIsOpen(false);
    setIsConfirmingLogout(false);
    onLogout?.();
  };

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
        <VendingMachineLogo height={50} width={30} />
        <Heading size={'sm'} color="green.600" _dark={{ color: "green.400" }}>S.V.M.</Heading>
      </Flex>

      {/* Right: Dark/Light Mode & Avatar */}
      <HStack gap={2}>
        <ColorModeButton />
        <Popover.Root
          open={isOpen}
          onOpenChange={handleOpenChange}
          positioning={{ placement: 'bottom-end', gutter: 8 }}
        >
          <Popover.Trigger asChild>
            <Box as="button" rounded="full" aria-label="Open user menu">
              <Avatar name={userName} src={userAvatar} size="sm" />
            </Box>
          </Popover.Trigger>
          <Portal>
            <Popover.Positioner>
              <Popover.Content width="200px">
                <Popover.Body>
                  {isConfirmingLogout ? (
                    <>
                      <Text fontSize="sm" mb={3}>
                        Confirm logout?
                      </Text>
                      <HStack justify="flex-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsConfirmingLogout(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          colorPalette="red"
                          onClick={handleConfirmLogout}
                        >
                          Logout
                        </Button>
                      </HStack>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      width="full"
                      variant="ghost"
                      onClick={() => setIsConfirmingLogout(true)}
                    >
                      Logout
                    </Button>
                  )}
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>
      </HStack>
    </Flex>
  );
}
