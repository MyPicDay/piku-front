export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const past = new Date(dateString);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (Number.isNaN(seconds) || seconds < 0) {
    return '날짜 정보 없음';
  }

  if (seconds < 5) {
    return '방금 전';
  }
  if (seconds < 60) {
    return `${seconds}초 전`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}분 전`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}시간 전`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}일 전`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}달 전`;
  }

  const years = Math.floor(days / 12);
  return `${years}년 전`;
};

export const formatYearMonthDay = (dateString?: string): string => {
  if (!dateString) {
    return '날짜 정보 없음';
  }
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return '유효하지 않은 날짜';
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return '날짜 변환 오류';
  }
};

export const formatYearMonthDayDots = (dateString?: string): string => {
  if (!dateString) {
    return '날짜 정보 없음';
  }
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return '유효하지 않은 날짜';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch (error) {
    return '날짜 변환 오류';
  }
};

export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
}; 