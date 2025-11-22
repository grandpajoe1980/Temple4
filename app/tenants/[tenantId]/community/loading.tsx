export default function CommunityLoading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-48 bg-gray-100 rounded-md animate-pulse" />
      <div className="h-3 w-96 bg-gray-100 rounded-md animate-pulse" />
      <div className="mt-4 rounded-lg border border-gray-200 p-6">
        <div className="h-4 bg-gray-100 rounded-md w-3/4 animate-pulse" />
        <div className="mt-2 h-3 bg-gray-100 rounded-md w-1/2 animate-pulse" />
      </div>
    </div>
  );
}
