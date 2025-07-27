'use client';

import SignupForm from '@/components/auth/SignupForm';
import CharacterSelection from '@/components/auth/CharacterSelection';
import { AuthFormProps } from '@/types/auth';

interface MobileViewProps extends AuthFormProps {
  step: number;
  nextStep: () => void;
}

const MobileView = ({
  step,
  handleChange,
  values,
  nextStep,
  handleSubmit,
  isLoading,
  isEmailVerified,
  isVerificationSent,
  handleSendVerification,
  handleVerifyCode,
  verificationMessage,
  agreements,
  handleAgreeAllChange,
  handleAgreementChange,
  errors,
  emailDomains,
  isSendingVerification,
}: MobileViewProps) => {
  const isAgreed = agreements.terms && agreements.privacy;
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-grow">
        {step === 1 && (
          <SignupForm
            handleChange={handleChange}
            values={values}
            isEmailVerified={isEmailVerified}
            isVerificationSent={isVerificationSent}
            handleSendVerification={handleSendVerification}
            handleVerifyCode={handleVerifyCode}
            verificationMessage={verificationMessage}
            agreements={agreements}
            handleAgreeAllChange={handleAgreeAllChange}
            handleAgreementChange={handleAgreementChange}
            errors={errors}
            emailDomains={emailDomains}
            isSendingVerification={isSendingVerification}
          />
        )}
        {step === 2 && <CharacterSelection handleChange={handleChange} values={values} />}
      </div>
      <div className="pt-6">
        {step === 1 && (
          <button
            onClick={nextStep}
            className="w-full bg-black dark:bg-gray-200 text-white dark:text-black py-3 rounded-full text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-900 dark:hover:bg-gray-400 cursor-pointer"
            disabled={!isEmailVerified || !isAgreed}
          >
            다음
          </button>
        )}
        {step === 2 && (
          <button
            onClick={handleSubmit}
            className="w-full bg-black dark:bg-gray-200 text-white dark:text-black py-3 rounded-full text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-900 dark:hover:bg-gray-400 cursor-pointer"
            disabled={isLoading || !values.character || !isAgreed}
          >
            {isLoading ? '가입 중...' : '회원 가입'}
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileView; 