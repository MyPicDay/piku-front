import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '비밀번호 재설정 - PikU',
  description: '계정 비밀번호를 안전하게 재설정하세요',
};
import PasswordResetClient from '@/components/auth/PasswordResetClient';

const PasswordResetPage = () => {
  return <PasswordResetClient />;
};

export default PasswordResetPage; 