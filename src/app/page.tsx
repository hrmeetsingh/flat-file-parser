// src/app/page.tsx
import FlatFileParser from '@/components/flat-file-parser/FlatFileParser';

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <FlatFileParser />
    </main>
  );
}