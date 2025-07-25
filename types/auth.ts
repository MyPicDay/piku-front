export interface Agreements {
  terms: boolean;
  privacy: boolean;
}

export interface AuthValues {
  email: string;
  password: string;
  nickname: string;
  character: string;
  verificationCode?: string;
}

export interface AuthFormProps {
  step?: number;
  nextStep?: () => void;
  prevStep?: () => void;
  handleChange: (input: string) => (e: { target: { value: string } }) => void;
  values: AuthValues;
  handleSubmit?: () => void;
  isLoading?: boolean;
  isEmailVerified: boolean;
  isVerificationSent: boolean;
  handleSendVerification: () => void;
  handleVerifyCode: () => void;
  verificationMessage: string;
  agreements: Agreements;
  handleAgreeAllChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAgreementChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
}

export interface PwdResetRequest {
  email: string;
  password: string;
}

export interface EmailVerificationRequest {
  email: string;
  code: string;
  type: 'SIGN_UP' | 'PASSWORD_RESET';
} 