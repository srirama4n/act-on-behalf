import { motion, useReducedMotion } from 'framer-motion';

export function TypingDots() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="flex justify-start px-3"
      data-testid="typing-dots"
      role="status"
      aria-live="polite"
      aria-label="Assistant is typing"
    >
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-wf-gray-300 bg-wf-white px-3 py-2.5">
        {[0, 1, 2].map((i) =>
          reduceMotion ? (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-wf-gray-700 opacity-70"
            />
          ) : (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-wf-gray-700"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ),
        )}
      </div>
    </div>
  );
}
