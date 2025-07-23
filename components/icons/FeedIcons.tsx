const iconProps = {
  className: 'w-6 h-6',
};

export const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    {...iconProps}
    xmlns="http://www.w3.org/2000/svg"
    fill={filled ? 'currentColor' : 'none'}
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
    className={`w-7 h-7 ${filled ? 'text-red-500' : ''}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
    />
  </svg>
);

export const CommentIcon = () => (
  <svg
    {...iconProps}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.006 3 11.5c0 2.39.998 4.602 2.635 6.143.24.18.445.378.625.585.18.207.333.424.45.651.115.225.21.46.28.702.07.24.114.485.13.735.018.25.02.502.02.754v.255a.75.75 0 001.5 0v-.255c0-.252-.002-.504-.02-.754a4.92 4.92 0 00-.13-.735 4.903 4.903 0 00-.28-.702 5.01 5.01 0 00-.45-.651 6.658 6.658 0 00-.625-.585A8.935 8.935 0 013.75 11.5 7.5 7.5 0 0112 4.5a7.5 7.5 0 018.25 7.5c0 4.136-3.364 7.5-7.5 7.5a1.5 1.5 0 01-1.5-1.5"
    />
  </svg>
);

export const ShareIcon = () => (
  <svg
    {...iconProps}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
    />
  </svg>
);

export const BookmarkIcon = () => (
  <svg
    {...iconProps}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.5 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
    />
  </svg>
);

export const MoreIcon = () => (
  <svg
    {...iconProps}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
    />
  </svg>
);

export const SmileyIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
); 