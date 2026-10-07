import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastCtx = { toast: (message: string) => void };

const Ctx = createContext<ToastCtx>({ toast: () => undefined });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const toast = useCallback((msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {message ? (
        <div
          role="status"
          className="pointer-events-none absolute bottom-24 left-1/2 z-50 max-w-[85%] -translate-x-1/2 rounded-full bg-wf-ink px-4 py-2 text-center text-xs font-medium text-wf-white shadow-lg"
        >
          {message}
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
