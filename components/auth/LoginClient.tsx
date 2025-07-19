'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/api/auth';
import Link from 'next/link';
import useAuthStore from '@/components/store/authStore';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

const LoginClient = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      
      let token: string | null = null;
      const authHeader = response.headers['authorization'];
      const user = response.data.user;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
        if (token != null) {
          localStorage.setItem(AUTH_TOKEN_KEY, token);
        }
      } else {
        console.warn('응답 헤더에 토큰이 없습니다.');
      }

      if (token && user) {
        useAuthStore.getState().login(user);
        
        setMessage('로그인 성공! 메인 페이지로 이동합니다.');
        setTimeout(() => router.push('/'), 1000);
      } else {
        // 성공 응답을 받았으나 토큰이나 유저 정보가 없는 경우
        throw new Error('인증 정보가 올바르지 않습니다.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '로그인 중 오류가 발생했습니다.';
      setMessage(errorMessage);
      console.error('로그인 실패:', error);
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
            <h2 className="text-2xl font-bold inline-block dark:text-white">로그인</h2>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              이메일
            </label>
            <input
              className="appearance-none border dark:border-gray-600 rounded-xl w-full py-3 px-4 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              비밀번호
            </label>
            <input
              className="appearance-none border dark:border-gray-600 rounded-xl w-full py-3 px-4 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="w-full bg-black dark:bg-gray-200 text-white dark:text-black py-3 rounded-full text-lg font-semibold disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>
          <div className="text-center mt-6">
            <p className="text-gray-600 dark:text-gray-400">
              계정이 없으신가요?{' '}
              <Link href="/signup" className="font-bold text-blue-500 hover:text-blue-800">
                가입하기
              </Link>
            </p>
          </div>
          {message && (
            <p className={`mt-4 text-center ${message.includes('성공') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginClient; 