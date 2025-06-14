'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMediaQuery } from 'react-responsive';
import SignupForm from '@/components/auth/SignupForm';
import CharacterSelection from '@/components/auth/CharacterSelection';
import { signup } from '@/api/auth';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  handleChange: (input: string) => (e: { target: { value: string } }) => void;
  values: {
    email: string;
    password: string;
    nickname: string;
    character: string;
  };
  handleSubmit: () => void;
  isLoading: boolean;
}

interface MobileViewProps extends AuthFormProps {
  step: number;
  nextStep: () => void;
}

const MobileView = ({ step, handleChange, values, nextStep, handleSubmit, isLoading }: MobileViewProps) => (
  <div className="flex flex-col h-full w-full">
    <div className="flex-grow">
      {step === 1 && <SignupForm handleChange={handleChange} values={values} />}
      {step === 2 && <CharacterSelection handleChange={handleChange} values={values} />}
    </div>
    <div className="pt-6">
      {step === 1 && (
        <button onClick={nextStep} className="w-full bg-black text-white py-3 rounded-full text-lg font-semibold">
          다음
        </button>
      )}
      {step === 2 && (
        <button onClick={handleSubmit} className="w-full bg-black text-white py-3 rounded-full text-lg font-semibold disabled:opacity-50" disabled={isLoading}>
          {isLoading ? '가입 중...' : '회원 가입'}
        </button>
      )}
    </div>
  </div>
);

const DesktopView = ({ handleChange, values, handleSubmit, isLoading }: AuthFormProps) => (
  <div className="grid md:grid-cols-2 gap-16 w-full items-start">
    <div className="h-full">
      <SignupForm handleChange={handleChange} values={values} />
    </div>
    <div className="flex flex-col h-full">
      <div className="flex-grow">
        <CharacterSelection handleChange={handleChange} values={values} />
      </div>
      <div className="pt-6">
        <button onClick={handleSubmit} className="w-full bg-black text-white py-3 rounded-full text-lg font-semibold disabled:opacity-50" disabled={isLoading}>
          {isLoading ? '가입 중...' : '회원 가입'}
        </button>
      </div>
    </div>
  </div>
);

const SignupClient = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [character, setCharacter] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const formData = { email, password, nickname, character };

  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleChange = (input: string) => (e: { target: { value: string } }) => {
    setMessage('');
    switch (input) {
      case 'email':
        setEmail(e.target.value);
        break;
      case 'password':
        setPassword(e.target.value);
        break;
      case 'nickname':
        setNickname(e.target.value);
        break;
      case 'character':
        setCharacter(e.target.value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async () => {
    setMessage('');
    setIsLoading(true);
    try {
      await signup(formData);
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md md:max-w-4xl px-8 flex flex-col justify-center" style={{minHeight: '80vh'}}>
        <div className="w-full mb-10">
            <div className="relative text-center">
              <Link href={isDesktop && isHydrated ? "/" : "#"} passHref>
                <button onClick={!isDesktop && step === 2 ? prevStep : undefined} className="text-2xl font-bold absolute left-0">&lt;</button>
              </Link>
              <h2 className="text-2xl font-bold inline-block">가입하기</h2>
            </div>
        </div>
        
        <div className={`w-full ${isDesktop && isHydrated ? 'flex items-center' : 'flex'}`}>
          {isDesktop && isHydrated ? (
            <DesktopView handleChange={handleChange} values={formData} handleSubmit={handleSubmit} isLoading={isLoading} />
          ) : (
            <MobileView step={step} nextStep={nextStep} handleChange={handleChange} values={formData} handleSubmit={handleSubmit} isLoading={isLoading} />
          )}
        </div>
        {message && (
          <p className={`mt-4 text-center ${message.includes('성공') || message.includes('완료') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default SignupClient; 