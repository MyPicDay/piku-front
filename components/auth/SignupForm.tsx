'use client';

import React, { useState } from 'react';
import { Mail, Lock, User, KeyRound, Info } from 'lucide-react';
import { AuthFormProps } from '@/types/auth';
import PolicyModal from '@/components/common/PolicyModal';
import { termsOfService } from '@/lib/policies/terms';
import { privacyPolicy } from '@/lib/policies/privacy';

const SignupForm = ({
  handleChange,
  values,
  isEmailVerified,
  isVerificationSent,
  handleSendVerification,
  handleVerifyCode,
  verificationMessage,
  agreements,
  handleAgreeAllChange,
  handleAgreementChange,
  errors,
  emailDomains = [],
  isSendingVerification,
}: AuthFormProps) => {
  const [modalContent, setModalContent] = useState<{ title: string; content: string; type: 'terms' | 'privacy' } | null>(
    null,
  );
  const [showDomainTooltip, setShowDomainTooltip] = useState(false);

  const handleLabelClick = (type: 'terms' | 'privacy') => {
    if (type === 'terms') {
      setModalContent({ title: '이용약관', content: termsOfService, type });
    } else {
      setModalContent({ title: '개인정보 처리방침', content: privacyPolicy, type });
    }
  };

  const closeModal = () => {
    setModalContent(null);
  };

  const handleAgree = () => {
    if (modalContent) {
      handleAgreementChange({
        target: { name: modalContent.type, checked: true },
      } as React.ChangeEvent<HTMLInputElement>);
      closeModal();
    }
  };



  return (
    <>
      <form className="space-y-6">
        <div className="flex items-center space-x-4">
          <Mail className="text-gray-400" />
          <div className="flex-grow flex items-center gap-2">
            <input
              type="email"
              placeholder="이메일을 입력해주세요"
              onChange={handleChange('email')}
              value={values.email}
              className={`w-full border-b-2 ${errors?.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:border-black dark:focus:border-white dark:bg-black dark:text-white outline-none p-2`}
              disabled={isEmailVerified}
            />
            <div className="relative">
              <Info 
                className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-200" 
                size={20}
                onMouseEnter={() => setShowDomainTooltip(true)}
                onMouseLeave={() => setShowDomainTooltip(false)}
                onClick={() => setShowDomainTooltip(!showDomainTooltip)}
              />
              {showDomainTooltip && emailDomains && emailDomains.length > 0 && (
                <div className="absolute top-6 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-3 z-10 min-w-48">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">허용된 이메일 도메인:</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {emailDomains.map((domain) => (
                      <li key={domain} className="flex items-center">
                        <span className="mr-2">•</span>
                        <span>@{domain}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSendVerification}
            disabled={isEmailVerified || !values.email || !!errors?.email || isSendingVerification}
            className="whitespace-nowrap flex-shrink-0 text-sm bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
          >
            {isSendingVerification ? '전송 중...' : isEmailVerified ? '인증완료' : '전송'}
          </button>
        </div>
        {errors?.email && <p className="text-red-500 text-xs mt-1 pl-10">{errors.email}</p>}

        {isVerificationSent && (
          <div>
            <div className="flex items-center space-x-4">
              <KeyRound className="text-gray-400" />
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="인증코드를 입력하세요"
                  onChange={handleChange('verificationCode')}
                  value={values.verificationCode}
                  className={`w-full border-b-2 ${
                    verificationMessage ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } focus:border-black dark:focus:border-white dark:bg-black dark:text-white outline-none p-2`}
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyCode}
                className="text-sm bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md cursor-pointer"
              >
                인증
              </button>
            </div>
            {verificationMessage && <p className="text-red-500 text-xs mt-1 pl-10">{verificationMessage}</p>}
          </div>
        )}

        <div className="flex items-center space-x-4">
          <Lock className="text-gray-400" />
          <input
            type="password"
            placeholder="비밀번호를 입력해주세요"
            onChange={handleChange('password')}
            value={values.password}
            className={`w-full border-b-2 ${errors?.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:border-black dark:focus:border-white dark:bg-black dark:text-white outline-none p-2`}
          />
        </div>
        {errors?.password && <p className="text-red-500 text-xs mt-1 pl-10">{errors.password}</p>}
        <div className="flex items-center space-x-4">
          <Lock className="text-gray-400" />
          <input
            type="password"
            placeholder="비밀번호를 다시 입력해주세요"
            onChange={handleChange('passwordConfirm')}
            value={values.passwordConfirm}
            className={`w-full border-b-2 ${errors?.passwordConfirm ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:border-black dark:focus:border-white dark:bg-black dark:text-white outline-none p-2`}
          />
        </div>
        {errors?.passwordConfirm && <p className="text-red-500 text-xs mt-1 pl-10">{errors.passwordConfirm}</p>}
        <div className="flex items-center space-x-4">
          <User className="text-gray-400" />
          <input
            type="text"
            placeholder="닉네임을 입력해주세요"
            onChange={handleChange('nickname')}
            value={values.nickname}
            className="w-full border-b-2 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white dark:bg-black dark:text-white outline-none p-2"
          />
        </div>
        
        <div className="pt-6 space-y-4">
          <div className="flex items-center">
            <input
              id="agree-all"
              name="agree-all"
              type="checkbox"
              className="h-4 w-4 text-piku-blue focus:ring-piku-blue border-gray-300 rounded"
              onChange={handleAgreeAllChange}
              checked={agreements?.terms && agreements?.privacy}
            />
            <label htmlFor="agree-all" className="ml-2 block text-gray-900 dark:text-gray-300">
              모두 동의
            </label>
          </div>
          <hr className="border-gray-300 dark:border-gray-700" />
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                className="h-5 w-5"
                checked={agreements?.terms}
                onChange={handleAgreementChange}
              />
              <label htmlFor="terms" className="ml-3 text-gray-700 dark:text-gray-300">
                이용약관 동의
              </label>
            </div>
            <button type="button" onClick={() => handleLabelClick('terms')} className="text-sm text-blue-500 hover:underline cursor-pointer">
              보기
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="privacy"
                name="privacy"
                className="h-5 w-5"
                checked={agreements?.privacy}
                onChange={handleAgreementChange}
              />
              <label htmlFor="privacy" className="ml-3 text-gray-700 dark:text-gray-300">
                개인정보 취급방침 동의
              </label>
            </div>
            <button type="button" onClick={() => handleLabelClick('privacy')} className="text-sm text-blue-500 hover:underline cursor-pointer">
              보기
            </button>
          </div>
        </div>
      </form>
      {modalContent && (
        <PolicyModal
          title={modalContent.title}
          content={modalContent.content}
          onClose={closeModal}
          onAgree={handleAgree}
        />
      )}
    </>
  );
};

export default SignupForm; 