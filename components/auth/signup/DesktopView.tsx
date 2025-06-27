'use client';

import SignupForm from '@/components/auth/SignupForm';
import CharacterSelection from '@/components/auth/CharacterSelection';
import { AuthFormProps } from '@/types/auth';

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
        <button
          onClick={handleSubmit}
          className="w-full bg-black dark:bg-gray-200 text-white dark:text-black py-3 rounded-full text-lg font-semibold disabled:opacity-50"
          disabled={isLoading || !values.character}
        >
          {isLoading ? '가입 중...' : '회원 가입'}
        </button>
      </div>
    </div>
  </div>
);

export default DesktopView; 