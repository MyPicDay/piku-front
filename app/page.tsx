import HomeRoot from '@/components/home/HomeRoot';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PikU - 홈',
  description: '캐릭터로 기록하는 하루 한 장 - 홈',
};

export default function Home() {
  return <HomeRoot />;
}
