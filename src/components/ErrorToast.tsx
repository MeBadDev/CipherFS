interface ErrorToastProps {
  message: string | null;
}

export function ErrorToast({ message }: ErrorToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-red-900 border border-red-700 text-red-200 px-6 py-3 shadow-lg">
        {message}
      </div>
    </div>
  );
}
