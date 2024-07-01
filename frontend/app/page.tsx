import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-300">
      <Link href="/main" className="bg-red-500 text-white text-xl p-10 rounded-md">
        お買い物START!
      </Link>
    </div>
  );
}
