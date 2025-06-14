'use client';

import React, { useState, useEffect } from 'react';
import { getFixedCharacters, FixedCharacter } from '@/api/character';
import Image from 'next/image';

interface CharacterSelectionProps {
    handleChange: (input: string) => (e: { target: { value: string } }) => void;
    values: {
        character: string;
    };
}

const CharacterSelection = ({ handleChange, values }: CharacterSelectionProps) => {
  const [characters, setCharacters] = useState<FixedCharacter[]>([]);
  const [selected, setSelected] = useState(values.character);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const data = await getFixedCharacters();
        if (data && Array.isArray(data)) {
          setCharacters(data);
        }
      } catch (error) {
        console.error('Failed to fetch characters:', error);
      }
    };
    fetchCharacters();
  }, []);

  const handleSelect = (characterId: number) => {
    const idAsString = String(characterId);
    setSelected(idAsString);
    handleChange('character')({ target: { value: idAsString } });
  }

  return (
    <>
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold">캐릭터 선택</h3>
        <p className="text-gray-600">선택하신 캐릭터로 일기의 이미지가 생성됩니다</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {characters.map((char, index) => (
          <div
            key={char.id}
            className={`relative border-2 rounded-lg p-4 cursor-pointer flex justify-center items-center h-32
              ${selected === String(char.id) ? 'border-blue-500' : 'border-gray-300'}`}
            onClick={() => handleSelect(char.id)}
          >
            {selected === String(char.id) && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
              </div>
            )}
            <img
              src={char.displayImageUrl}
              alt={`캐릭터 ${char.type}`}
              width={700}
              height={150}
              className="object-contain"
              loading={index < 2 ? "eager" : "lazy"}
              // priority={index < 2}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default CharacterSelection; 