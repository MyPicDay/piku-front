import api  from './api';

export const submitInquiry = async (formData: FormData) => {
  await api.post('/inquiry', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}; 