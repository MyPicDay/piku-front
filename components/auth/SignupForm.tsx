'use client';

import React, { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';

const SignupForm = ({ handleChange, values }: { handleChange: any, values: any }) => {
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
  });

  const agreeAll = agreements.terms && agreements.privacy;

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

  return (
    <>
      <form className="space-y-6">
        <div className="flex items-center space-x-4">
          <Mail className="text-gray-400" />
          <input
            type="email"
            placeholder="email@example.com"
            onChange={handleChange('email')}
            defaultValue={values.email}
            className="w-full border-b-2 border-gray-300 focus:border-black outline-none p-2"
          />
        </div>
        <div className="flex items-center space-x-4">
          <Lock className="text-gray-400" />
          <input
            type="password"
            placeholder="비밀번호를 입력해주세요"
            onChange={handleChange('password')}
            defaultValue={values.password}
            className="w-full border-b-2 border-gray-300 focus:border-black outline-none p-2"
          />
        </div>
        <div className="flex items-center space-x-4">
          <Lock className="text-gray-400" />
          <input
            type="password"
            placeholder="비밀번호를 다시 입력해주세요"
            className="w-full border-b-2 border-gray-300 focus:border-black outline-none p-2"
          />
        </div>
        <div className="flex items-center space-x-4">
          <User className="text-gray-400" />
          <input
            type="text"
            placeholder="닉네임을 입력해주세요"
            onChange={handleChange('nickname')}
            defaultValue={values.nickname}
            className="w-full border-b-2 border-gray-300 focus:border-black outline-none p-2"
          />
        </div>
        
        <div className="pt-6 space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="agree-all"
              className="h-5 w-5 rounded-full"
              checked={agreeAll}
              onChange={handleAgreeAllChange}
            />
            <label htmlFor="agree-all" className="ml-3 text-gray-700">모두 동의</label>
          </div>
          <hr />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              className="h-5 w-5"
              checked={agreements.terms}
              onChange={handleAgreementChange}
            />
            <label htmlFor="terms" className="ml-3 text-gray-700">이용약관 동의</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="privacy"
              name="privacy"
              className="h-5 w-5"
              checked={agreements.privacy}
              onChange={handleAgreementChange}
            />
            <label htmlFor="privacy" className="ml-3 text-gray-700">개인정보 취급방침 동의</label>
          </div>
        </div>
      </form>
    </>
  );
};

export default SignupForm; 