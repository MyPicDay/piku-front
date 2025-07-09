import Image from 'next/image';

interface FriendActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: 'cancel' | 'unfriend';
  nickname: string;
  avatar: string;
  isLoading: boolean;
}

const FriendActionConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  nickname,
  avatar,
  isLoading,
}: FriendActionConfirmModalProps) => {
  if (!isOpen) return null;

  const messages = {
    cancel: `${nickname}님에게 보낸 친구 요청을 취소하시겠습니까?`,
    unfriend: `${nickname}님과의 친구 관계를 정리하시겠어요?`,
  };

  const buttonTexts = {
    cancel: '요청 취소',
    unfriend: '친구 끊기',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white text-center shadow-xl dark:bg-gray-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center p-6">
          <Image
            src={avatar || 'https://via.placeholder.com/96'}
            alt={nickname}
            width={96}
            height={96}
            className="rounded-full object-cover"
            unoptimized
          />
          <p className="mt-4 px-4 text-base">{messages[actionType]}</p>
        </div>
        <div className="flex flex-col border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full py-3 font-semibold text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {isLoading ? '처리 중...' : buttonTexts[actionType]}
          </button>
          <button
            onClick={onClose}
            className="w-full border-t border-gray-200 py-3 text-sm text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendActionConfirmModal; 