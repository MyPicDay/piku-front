export interface AuthValues {
  email: string;
  password: string;
  nickname: string;
  character: string;
}

export interface AuthFormProps {
  handleChange: (input: string) => (e: { target: { value: string } }) => void;
  values: AuthValues;
  handleSubmit: () => void;
  isLoading: boolean;
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
} 