import {
  Button,
  HStack,
  IconButton,
  Stack,
  Tooltip,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  ButtonProps,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  ChevronLeftIcon,
  CloudOffIcon,
  LockedIcon,
  UnlockedIcon,
} from '@/components/icons'
import { useTypebot } from '@/features/editor'
import { useWorkspace } from '@/features/workspace'
import { InputBlockType } from 'models'
import { useRouter } from 'next/router'
import { isNotDefined } from 'utils'
import { ChangePlanModal, isFreePlan, LimitReached } from '@/features/billing'
import { timeSince } from '@/utils/helpers'

export const PublishButton = (props: ButtonProps) => {
  const warningTextColor = useColorModeValue('red.300', 'red.600')
  const { workspace } = useWorkspace()
  const { push, query } = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const {
    isPublishing,
    isPublished,
    publishTypebot,
    publishedTypebot,
    restorePublishedTypebot,
    typebot,
    isSavingLoading,
    updateTypebot,
    unpublishTypebot,
    save,
  } = useTypebot()

  const hasInputFile = typebot?.groups
    .flatMap((g) => g.blocks)
    .some((b) => b.type === InputBlockType.FILE)

  const handlePublishClick = () => {
    if (isFreePlan(workspace) && hasInputFile) return onOpen()
    publishTypebot()
    if (!publishedTypebot) push(`/typebots/${query.typebotId}/share`)
  }

  const closeTypebot = async () => {
    updateTypebot({ isClosed: true })
    await save()
  }

  const openTypebot = async () => {
    updateTypebot({ isClosed: false })
    await save()
  }

  return (
    <HStack spacing="1px">
      <ChangePlanModal
        isOpen={isOpen}
        onClose={onClose}
        type={LimitReached.FILE_INPUT}
      />
      <Tooltip
        placement="bottom-end"
        label={
          <Stack>
            {!publishedTypebot?.version ? (
              <Text color={warningTextColor} fontWeight="semibold">
                This will deploy your bot with an updated engine. Make sure to
                test it properly in preview mode before publishing.
              </Text>
            ) : (
              <Text>There are non published changes.</Text>
            )}
            <Text fontStyle="italic">
              Published version from{' '}
              {publishedTypebot &&
                timeSince(publishedTypebot.updatedAt.toString())}{' '}
              ago
            </Text>
          </Stack>
        }
        isDisabled={isNotDefined(publishedTypebot) || isPublished}
      >
        <Button
          colorScheme="blue"
          isLoading={isPublishing || isSavingLoading}
          isDisabled={isPublished}
          onClick={handlePublishClick}
          borderRightRadius={publishedTypebot ? 0 : undefined}
          {...props}
        >
          {isPublished
            ? typebot?.isClosed
              ? 'Closed'
              : 'Published'
            : 'Publish'}
        </Button>
      </Tooltip>

      {publishedTypebot && (
        <Menu>
          <MenuButton
            as={IconButton}
            colorScheme={'blue'}
            borderLeftRadius={0}
            icon={<ChevronLeftIcon transform="rotate(-90deg)" />}
            aria-label="Show published typebot menu"
            size="sm"
            isDisabled={isPublishing || isSavingLoading}
          />
          <MenuList>
            {!isPublished && (
              <MenuItem onClick={restorePublishedTypebot}>
                Restore published version
              </MenuItem>
            )}
            {!typebot?.isClosed ? (
              <MenuItem onClick={closeTypebot} icon={<LockedIcon />}>
                Close typebot to new responses
              </MenuItem>
            ) : (
              <MenuItem onClick={openTypebot} icon={<UnlockedIcon />}>
                Reopen typebot to new responses
              </MenuItem>
            )}
            <MenuItem onClick={unpublishTypebot} icon={<CloudOffIcon />}>
              Unpublish typebot
            </MenuItem>
          </MenuList>
        </Menu>
      )}
    </HStack>
  )
}
