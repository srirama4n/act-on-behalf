import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePhoneUiStore } from '@/store/phoneUi';

export function PushBanner() {
  const push = usePhoneUiStore((s) => s.push);
  const setActiveTab = usePhoneUiStore((s) => s.setActiveTab);
  const dismissPush = usePhoneUiStore((s) => s.dismissPush);
  const reduceMotion = useReducedMotion();

  return (
    <div aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {push ? (
          <motion.button
            key={push.id}
            type="button"
            initial={reduceMotion ? false : { y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { y: -80, opacity: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 380, damping: 28 }
            }
            className="absolute left-3 right-3 top-12 z-30 rounded-2xl border border-wf-gray-300 bg-wf-white/95 p-3 text-left shadow-phone backdrop-blur"
            onClick={() => {
              setActiveTab(push.targetTab);
              dismissPush();
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-wf-red">
              {push.title}
            </p>
            <p className="mt-0.5 text-xs text-wf-ink">{push.body}</p>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
