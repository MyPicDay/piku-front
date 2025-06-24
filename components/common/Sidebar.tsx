import {
  Home,
  Search,
  Compass,
  Clapperboard,
  Send,
  Bell,
  PlusSquare,
  User,
  Menu,
  Pocket,
  LogOut
} from 'lucide-react';
import Link from 'next/link';

const Sidebar = () => {
  return (
    <aside className="hidden md:flex flex-col border-r fixed h-full bg-white md:w-20 xl:w-64 transition-all duration-300">
      <div className="px-4 py-8">
        <Link
          href="/"
          className="flex items-center md:justify-center xl:justify-start"
        >
          <h1 className="text-2xl font-semibold font-serif md:hidden xl:block">
            PikU
          </h1>
          <Pocket className="w-8 h-8 hidden md:block xl:hidden" />
        </Link>
      </div>
      <nav className="flex flex-col grow px-2">
        <Link
          href="/"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Home className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">홈</span>
        </Link>
        {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Search className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">검색</span>
        </Link> */}
        {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Compass className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">탐색 탭</span>
        </Link> */}
        {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Clapperboard className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">릴스</span>
        </Link> */}
        {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Send className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">메시지</span>
        </Link> */}
        {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Bell className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">알림</span>
        </Link> */}
        <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <PlusSquare className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">일기 작성</span>
        </Link>
        <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <User className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">프로필</span>
        </Link>
        <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <LogOut className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">로그아웃</span>
        </Link>
      </nav>
      {/* <div className="p-4">
        <button className="flex items-center w-full p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start">
          <Menu className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">더 보기</span>
        </button>
      </div> */}
    </aside>
  );
};

export default Sidebar; 