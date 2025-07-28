'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMediaQuery } from 'react-responsive';
import {
  signup,
  sendSignUpVerificationEmail,
  verifyCode,
  getAllowedEmailDomains,
} from '@/api/auth';
import { useRouter } from 'next/navigation';
import MobileView from './signup/MobileView';
import DesktopView from './signup/DesktopView';
import { AuthValues } from '@/types/auth';

const SignupClient = () => {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<AuthValues>({
    email: '',
    password: '',
    passwordConfirm: '',
    nickname: '',
    character: '',
    verificationCode: '',
  });
  const [errors, setErrors] = useState({ email: '', password: '', passwordConfirm: '' });
  const [emailDomains, setEmailDomains] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
  });

  useEffect(() => {
    setIsHydrated(true);
    const fetchEmailDomains = async () => {
      try {
        const domains = await getAllowedEmailDomains();
        setEmailDomains(domains);
      } catch (error) {
        console.error('Failed to fetch email domains:', error);
        // 기본 도메인 목록 설정 또는 에러 처리
        setEmailDomains(['gmail.com', 'naver.com', 'kakao.com']);
      }
    };
    fetchEmailDomains();
  }, []);

  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

  const nextStep = () => {
    if (!isEmailVerified) {
      setMessage('이메일 인증을 완료해주세요.');
      return;
    }
    setMessage('');
    setStep(step + 1);
  };
  const prevStep = () => setStep(step - 1);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다.';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return '비밀번호는 소문자를 포함해야 합니다.';
    }
    if (!/(?=.*\d)/.test(password)) {
      return '비밀번호는 숫자를 포함해야 합니다.';
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return '비밀번호는 특수문자(@$!%*?&)를 포함해야 합니다.';
    }
    return '';
  }

  const handleChange = (input: string) => (e: { target: { value: string } }) => {
    const { value } = e.target;
    setMessage('');
    if (input === 'verificationCode') {
      setVerificationMessage('');
    }
    setValues({ ...values, [input]: value });

    if (input === 'email') {
      if (!validateEmail(value)) {
        setErrors(prev => ({ ...prev, email: '유효한 이메일 형식이 아닙니다.' }));
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    }

    if (input === 'password') {
      const passwordError = validatePassword(value);
      setErrors(prev => ({ ...prev, password: passwordError }));
      
      // 비밀번호 확인과 일치하는지 체크 (비밀번호 확인이 이미 입력된 경우)
      if (values.passwordConfirm && value !== values.passwordConfirm) {
        setErrors(prev => ({ ...prev, passwordConfirm: '비밀번호가 일치하지 않습니다.' }));
      } else if (values.passwordConfirm && value === values.passwordConfirm) {
        setErrors(prev => ({ ...prev, passwordConfirm: '' }));
      }
    }

    if (input === 'passwordConfirm') {
      if (value !== values.password) {
        setErrors(prev => ({ ...prev, passwordConfirm: '비밀번호가 일치하지 않습니다.' }));
      } else {
        setErrors(prev => ({ ...prev, passwordConfirm: '' }));
      }
    }
  };
  
  const handleAgreeAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setAgreements({
      terms: checked,
      privacy: checked,
    });
  };

  const handleAgreementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setAgreements((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSendVerification = async () => {
    if (!values.email) {
      setMessage('이메일을 입력해주세요.');
      return;
    }
    if (!validateEmail(values.email)) {
      setMessage('유효한 이메일 형식이 아닙니다.');
      return;
    }
    setIsLoading(true);
    setMessage('');
    setIsSendingVerification(true);
    try {
      await sendSignUpVerificationEmail(values.email);
      setIsVerificationSent(true);
      setMessage('인증코드가 발송되었습니다.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || '인증코드 발송에 실패했습니다.');
    } finally {
      setIsLoading(false);
      setIsSendingVerification(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!values.verificationCode) {
      setVerificationMessage('인증코드를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setVerificationMessage('');
    try {
      await verifyCode({ email: values.email, code: values.verificationCode, type: 'SIGN_UP' });
      setIsEmailVerified(true);
      setMessage('이메일 인증이 완료되었습니다.');
      setIsVerificationSent(false); // 인증 성공 시 입력창 숨김
    } catch (error: any) {
      setVerificationMessage(error.response?.data?.message || '인증코드가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isEmailVerified) {
      setMessage('이메일 인증을 완료해주세요.');
      return;
    }
    if (!values.character) {
      setMessage('캐릭터를 선택해주세요.');
      return;
    }
    const passwordError = validatePassword(values.password);
    if (passwordError) {
      setMessage(passwordError);
      return;
    }
    if (values.password !== values.passwordConfirm) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!agreements.terms || !agreements.privacy) {
      setMessage('이용약관에 동의해주세요.');
      return;
    }
    setMessage('');
    setIsLoading(true);
    try {
      const { verificationCode, passwordConfirm, ...signupData } = values;
      await signup(signupData);
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
              <button onClick={!isDesktop && step === 2 ? prevStep : undefined} className="text-2xl font-bold absolute left-0 dark:text-white cursor-pointer">
                &lt;
              </button>
            </Link>
            <h2 className="text-2xl font-bold inline-block dark:text-white">가입하기</h2>
          </div>
        </div>

        <div className={`w-full ${isDesktop && isHydrated ? 'flex items-center' : 'flex'}`}>
          {isDesktop && isHydrated ? (
            <DesktopView 
              handleChange={handleChange} 
              values={values} 
              handleSubmit={handleSubmit} 
              isLoading={isLoading} 
              isEmailVerified={isEmailVerified}
              isVerificationSent={isVerificationSent}
              handleSendVerification={handleSendVerification}
              handleVerifyCode={handleVerifyCode}
              verificationMessage={verificationMessage}
              agreements={agreements}
              handleAgreementChange={handleAgreementChange}
              handleAgreeAllChange={handleAgreeAllChange}
              errors={errors}
              emailDomains={emailDomains}
              isSendingVerification={isSendingVerification}
            />
          ) : (
            <MobileView
              step={step}
              nextStep={nextStep}
              handleChange={handleChange}
              values={values}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              isEmailVerified={isEmailVerified}
              isVerificationSent={isVerificationSent}
              handleSendVerification={handleSendVerification}
              handleVerifyCode={handleVerifyCode}
              verificationMessage={verificationMessage}
              agreements={agreements}
              handleAgreementChange={handleAgreementChange}
              handleAgreeAllChange={handleAgreeAllChange}
              errors={errors}
              emailDomains={emailDomains}
              isSendingVerification={isSendingVerification}
            />
          )}
        </div>
        {message && (
          <p
            className={`mt-4 text-center ${
              message.includes('완료') || message.includes('발송') ? 'text-green-600' : 'text-red-600'
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