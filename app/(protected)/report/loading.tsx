export default function ReportLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#1a1a1a]">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-[#8B0000]"></div>
        <p className="text-sm text-gray-400">Loading reports...</p>
      </div>
    </div>
  );
}
