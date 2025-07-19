'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/components/store/authStore';
import {
  acceptFriendRequest,
  cancelFriendRequest,
  deleteFriend,
  rejectFriendRequest,
  sendFriendRequest,
} from '@/api/friend';
import { FriendshipStatus, UserProfile } from '@/types/friend';
import { UserProfileResponseDTO, DiaryMonthCountDTO } from '@/types/profile';

interface ProfileClientProps {
  profileData: UserProfileResponseDTO &
    Partial<Pick<UserProfile, 'userId' | 'friendStatus'>>;
}

const ProfileClient = ({ profileData }: ProfileClientProps) => {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const isMyProfile = currentUser?.id === profileData.userId;

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const renderFriendButton = () => {
    if (!profileData.userId) {
      return null;
    }

    const handleApiCall = async (apiCall: () => Promise<any>) => {
      try {
        await apiCall();
        router.refresh();
      } catch (error) {
        console.error('친구 관련 작업 실패:', error);
        // TODO: 사용자에게 에러 알림
      }
    };

    const handleAddFriend = () =>
      handleApiCall(() => sendFriendRequest(profileData.userId!));
    const handleRemoveFriend = () =>
      handleApiCall(() => deleteFriend(profileData.userId!));
    const handleCancelRequest = () =>
      handleApiCall(() => cancelFriendRequest(profileData.userId!));
    const handleAcceptRequest = () =>
      handleApiCall(() => acceptFriendRequest(profileData.userId!));
    const handleRejectRequest = () =>
      handleApiCall(() => rejectFriendRequest(profileData.userId!));

    switch (profileData.friendStatus) {
      case FriendshipStatus.FRIEND:
        return (
          <button
            onClick={handleRemoveFriend}
            className="py-2 px-6 bg-gray-200 text-black rounded-full font-semibold text-sm"
          >
            친구 끊기
          </button>
        );
      case FriendshipStatus.NONE:
        return (
          <button
            onClick={handleAddFriend}
            className="py-2 px-6 bg-blue-500 text-white rounded-full font-semibold text-sm"
          >
            친구 추가
          </button>
        );
      case FriendshipStatus.SENT:
        return (
          <button
            onClick={handleCancelRequest}
            className="py-2 px-6 bg-gray-200 text-black rounded-full font-semibold text-sm"
          >
            요청 취소
          </button>
        );
      case FriendshipStatus.RECEIVED:
        return (
          <div className="flex justify-center space-x-2">
            <button
              onClick={handleAcceptRequest}
              className="py-2 px-6 bg-blue-500 text-white rounded-full font-semibold text-sm"
            >
              수락
            </button>
            <button
              onClick={handleRejectRequest}
              className="py-2 px-6 bg-gray-200 text-black rounded-full font-semibold text-sm"
            >
              거절
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white">
      {/* 프로필 상단 영역 */}
      <div className="bg-gray-100 h-32"></div>
      <div className="px-6 pb-6 -mt-16">
        <div className="relative w-32 h-32 mx-auto">
          <Image
            src={profileData.avatar || '/default-avatar.png'}
            alt="Profile Picture"
            width={128}
            height={128}
            className="rounded-full object-cover border-4 border-white bg-white"
          />
        </div>
        <h2 className="text-center text-2xl font-bold mt-4">
          {profileData.nickname}
        </h2>

        {/* 프로필 편집 / 친구 추가 버튼 */}
        <div className="w-full mt-4 flex justify-center">
          {isMyProfile ? (
            <button
              onClick={handleEditProfile}
              className="py-2 px-6 bg-gray-200 text-gray-800 rounded-full font-semibold text-sm"
            >
              프로필 편집
            </button>
          ) : (
            renderFriendButton()
          )}
        </div>

        {/* 친구/일기 카운트 */}
        <div className="flex justify-center items-center my-6 text-center">
          <div className="w-1/2">
            <p className="text-2xl font-bold">{profileData.friendCount}</p>
            <p className="text-sm text-gray-500">friend</p>
          </div>
          <div className="border-l h-8"></div>
          <div className="w-1/2">
            <p className="text-2xl font-bold">{profileData.diaryCount}</p>
            <p className="text-sm text-gray-500">diary</p>
          </div>
        </div>
      </div>

      {/* 월별 일기 기록 */}
      <div className="text-left px-6 py-4 border-t">
        <h3 className="text-xl font-bold mb-4">Diary</h3>
        <div className="relative">
          {profileData.monthlyDiaryCount &&
            profileData.monthlyDiaryCount.length > 1 && (
              <div className="absolute left-2.5 top-2.5 bottom-2.5 w-1 bg-gray-200"></div>
            )}
          <div className="space-y-4">
            {profileData.monthlyDiaryCount &&
            profileData.monthlyDiaryCount.length > 0 ? (
              profileData.monthlyDiaryCount.map(
                (stat: DiaryMonthCountDTO) => (
                  <div key={stat.month} className="flex items-center">
                    <div className="w-6 h-6 flex-shrink-0 mr-4 z-10">
                      <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto my-1.5"></div>
                    </div>
                    <div className="w-full p-4 border rounded-lg shadow-sm bg-white">
                      <div className="flex items-baseline mb-2">
                        <span className="text-lg font-semibold text-gray-800">
                          {stat.month}월
                        </span>
                        <span className="ml-1.5 text-xs text-gray-500">
                          ({stat.count}/{stat.daysInMonth})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-lime-400 h-2 rounded-full"
                          style={{
                            width: `${
                              stat.daysInMonth > 0
                                ? (stat.count / stat.daysInMonth) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ),
              )
            ) : (
              <p className="text-center text-gray-500">
                아직 작성된 일기 기록이 없어요.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileClient; 