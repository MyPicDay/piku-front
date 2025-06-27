'use client';

import SignupForm from '@/components/auth/SignupForm';
import CharacterSelection from '@/components/auth/CharacterSelection';
import { AuthFormProps } from '@/types/auth';

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
        <button onClick={nextStep} className="w-full bg-black dark:bg-gray-200 text-white dark:text-black py-3 rounded-full text-lg font-semibold">
          다음
        </button>
      )}
      {step === 2 && (
        <button
          onClick={handleSubmit}
          className="w-full bg-black dark:bg-gray-200 text-white dark:text-black py-3 rounded-full text-lg font-semibold disabled:opacity-50"
          disabled={isLoading || !values.character}
        >
          {isLoading ? '가입 중...' : '회원 가입'}
        </button>
      )}
    </div>
  </div>
);

export default MobileView; 