'use client';

import Link from 'next/link';

const LandingClient = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800">PikU</h1>
        <p className="mt-4 text-lg text-gray-600">
          나만의 캐릭터로 기록하는 하루 한 장
        </p>
      </div>
      <div className="mt-12 flex flex-col gap-4 w-full max-w-xs">
        {/* <button className="w-full bg-black text-white py-3 rounded-full text-lg font-semibold">
          게스트로 시작
        </button> */}
        <Link href="/login" passHref>
          <button className="w-full bg-black text-white py-3 rounded-full text-lg font-semibold">
            로그인
          </button>
        </Link>
        <Link href="/signup" passHref>
          <button className="text-gray-600 w-full">
            회원가입
          </button>
        </Link>
      </div>
    </div>
  );
};

export default LandingClient; 