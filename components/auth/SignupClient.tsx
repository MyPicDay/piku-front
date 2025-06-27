'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMediaQuery } from 'react-responsive';
import { signup } from '@/api/auth';
import { useRouter } from 'next/navigation';
import MobileView from './signup/MobileView';
import DesktopView from './signup/DesktopView';
import { AuthValues } from '@/types/auth';

const SignupClient = () => {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<AuthValues>({
    email: '',
    password: '',
    nickname: '',
    character: '',
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleChange = (input: string) => (e: { target: { value: string } }) => {
    setMessage('');
    setValues({ ...values, [input]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!values.character) {
      setMessage('캐릭터를 선택해주세요.');
      return;
    }
    setMessage('');
    setIsLoading(true);
    try {
      await signup(values);
      setMessage('회원가입이 완료되었습니다! 잠시 후 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '회원가입에 실패했습니다.';
      setMessage(errorMessage);
      console.error('Signup failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-md md:max-w-4xl px-8 flex flex-col justify-center" style={{ minHeight: '80vh' }}>
        <div className="w-full mb-10">
          <div className="relative text-center">
            <Link href={isDesktop && isHydrated ? '/' : '#'} passHref>
              <button onClick={!isDesktop && step === 2 ? prevStep : undefined} className="text-2xl font-bold absolute left-0 dark:text-white">
                &lt;
              </button>
            </Link>
            <h2 className="text-2xl font-bold inline-block dark:text-white">가입하기</h2>
          </div>
        </div>

        <div className={`w-full ${isDesktop && isHydrated ? 'flex items-center' : 'flex'}`}>
          {isDesktop && isHydrated ? (
            <DesktopView handleChange={handleChange} values={values} handleSubmit={handleSubmit} isLoading={isLoading} />
          ) : (
            <MobileView
              step={step}
              nextStep={nextStep}
              handleChange={handleChange}
              values={values}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}
        </div>
        {message && (
          <p
            className={`mt-4 text-center ${
              message.includes('성공') || message.includes('완료') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default SignupClient; 