'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendVerificationCode, verifyCode, resetPassword } from '@/api/auth';

const PasswordResetClient = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: password
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSendCode = async () => {
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      await sendVerificationCode(email, 'PASSWORD_RESET');
      setStep(2);
      setMessage('인증 코드가 발송되었습니다. 이메일을 확인해주세요.');
    } catch (err: any) {
      setError(err.response?.data?.message || '인증 코드 발송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      setError('인증 코드를 입력해주세요.');
      return;
    }
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      await verifyCode({ email, code, type: 'PASSWORD_RESET' });
      setStep(3);
      setMessage('인증에 성공했습니다. 새 비밀번호를 입력해주세요.');
    } catch (err: any) {
      setError(err.response?.data?.message || '인증에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await resetPassword({ email, password });
      setMessage('비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-md px-8">
        <div className="w-full mb-10">
          <div className="relative text-center">
            <button onClick={() => router.back()} className="text-2xl font-bold absolute left-0 dark:text-white">&lt;</button>
            <h2 className="text-2xl font-bold inline-block dark:text-white">비밀번호 재설정</h2>
          </div>
        </div>

        {step === 1 && (
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                이메일
              </label>
              <input
                className="appearance-none border dark:border-gray-600 rounded-xl w-full py-3 px-4 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                placeholder="가입한 이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              onClick={handleSendCode}
              className="w-full bg-black dark:bg-gray-200 text-white dark:text-black py-3 rounded-full text-lg font-semibold disabled:opacity-50"
              disabled={isLoading || !email}
            >
              {isLoading ? '전송 중...' : '인증 코드 받기'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="code">
                인증 코드
              </label>
              <input
                className="appearance-none border dark:border-gray-600 rounded-xl w-full py-3 px-4 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 leading-tight focus:outline-none focus:shadow-outline"
                id="code"
                type="text"
                placeholder="인증 코드를 입력하세요"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <button
              onClick={handleVerifyCode}
              className="w-full bg-black dark:bg-gray-200 text-white dark:text-black py-3 rounded-full text-lg font-semibold disabled:opacity-50"
              disabled={isLoading || !code}
            >
              {isLoading ? '확인 중...' : '인증 코드 확인'}
            </button>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                새 비밀번호
              </label>
              <input
                className="appearance-none border dark:border-gray-600 rounded-xl w-full py-3 px-4 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 leading-tight focus:outline-none focus:shadow-outline"
                id="password"
                type="password"
                placeholder="새로운 비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="confirm-password">
                새 비밀번호 확인
              </label>
              <input
                className="appearance-none border dark:border-gray-600 rounded-xl w-full py-3 px-4 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="confirm-password"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              className="w-full bg-black dark:bg-gray-200 text-white dark:text-black py-3 rounded-full text-lg font-semibold disabled:opacity-50"
              type="submit"
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
            >
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        )}
        
        {message && <p className="mt-4 text-center text-green-600">{message}</p>}
        {error && <p className="mt-4 text-center text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default PasswordResetClient; 