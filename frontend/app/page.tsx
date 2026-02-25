import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-800">Clausia</h1>
        <p className="mb-8 text-gray-600">Sistem Manajemen Siklus Kontrak Cerdas.</p>

        <SignedOut>
          <div className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">
            <SignInButton mode="modal" />
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex flex-col items-center gap-4">
            <p className="text-green-600 font-semibold">Anda berhasil masuk!</p>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </div>
    </main>
  );
}