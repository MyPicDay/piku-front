import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '친구 - PikU',
  description: '친구 관리와 친구 요청을 확인하세요',
};
import FriendsClient from '@/components/friends/FriendsClient';

const FriendsPage = () => {
  return <FriendsClient />;
};

export default FriendsPage; 