import { Button, Input, Text, VStack } from '@chakra-ui/react';
import {
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
} from '@svm/components/dialog';
import { Field } from '@svm/components/field';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  itemName: string;
  itemType: string;
  confirmText: string;
  onConfirmTextChange: (text: string) => void;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  itemName,
  itemType,
  confirmText,
  onConfirmTextChange,
}: DeleteConfirmDialogProps) {
  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <DialogBackdrop />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {itemType}</DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger />
        <DialogBody>
          <VStack gap={4} align="stretch">
            <Text>
              Are you sure you want to delete {itemType.toLowerCase()} <strong>{itemName}</strong>?
            </Text>
            <Text color="red.600" _dark={{ color: 'red.400' }} fontSize="sm">
              This action cannot be undone.
            </Text>
            <Field label='Type "delete" to confirm' required>
              <Input
                placeholder='Type "delete" to confirm'
                value={confirmText}
                onChange={(e) => onConfirmTextChange(e.target.value)}
              />
            </Field>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorPalette="red"
            onClick={onConfirm}
            loading={isSubmitting}
            disabled={confirmText !== 'delete'}
          >
            Delete {itemType}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
