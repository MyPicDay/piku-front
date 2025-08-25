import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회원가입 - PikU',
  description: '간단한 회원가입으로 PikU를 시작해보세요',
};
import SignupClient from '@/components/auth/SignupClient';

export default function SignupPage() {
  return <SignupClient />;
} 