export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="text-center py-24">
      <h1 className="text-4xl font-bold text-yellow-600 mb-4">Something went wrong</h1>
      <p className="text-gray-600">{error.message}</p>
      <a href="/" className="text-yellow-700 underline mt-4 block">Go Home</a>
    </div>
  );
}
