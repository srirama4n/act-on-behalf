import { motion, useReducedMotion } from 'framer-motion';
import { useRef, type PointerEvent } from 'react';
import type { FargoMessage } from '@/contracts/chatService';
import { AnnotatedText } from './AnnotatedText';
import { DisclosureNote } from './DisclosureNote';

type MessageBubbleProps =
  | {
      role: 'user';
      text: string;
      onLongPress?: (payload: unknown) => void;
    }
  | {
      role: 'assistant';
      message: FargoMessage;
      agentCaption?: string | null;
      onLongPress?: (payload: unknown) => void;
    }
  | {
      role: 'error';
      errorCode: string;
      errorMessage: string;
      onRetry: () => void;
      retryLabel: string;
      onLongPress?: (payload: unknown) => void;
    };

function useLongPressHandlers(
  payload: unknown,
  onLongPress?: (payload: unknown) => void,
) {
  const timer = useRef<number | null>(null);

  const clear = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  if (!onLongPress) {
    return {};
  }

  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.button !== 0) return;
      clear();
      timer.current = window.setTimeout(() => {
        onLongPress(payload);
      }, 450);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
}

export function MessageBubble(props: MessageBubbleProps) {
  if (props.role === 'user') {
    return <UserBubble {...props} />;
  }
  if (props.role === 'error') {
    return <ErrorBubble {...props} />;
  }
  return <AssistantBubble {...props} />;
}

function UserBubble({
  text,
  onLongPress,
}: {
  text: string;
  onLongPress?: (payload: unknown) => void;
}) {
  const reduceMotion = useReducedMotion();
  const lp = useLongPressHandlers({ text }, onLongPress);
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-end px-3"
    >
      <div
        className="max-w-[85%] select-none rounded-2xl rounded-br-md bg-wf-red px-3 py-2 text-sm font-medium text-wf-white"
        {...lp}
      >
        <AnnotatedText text={text} annotated={false} />
      </div>
    </motion.div>
  );
}

function ErrorBubble({
  errorCode,
  errorMessage,
  onRetry,
  retryLabel,
  onLongPress,
}: {
  errorCode: string;
  errorMessage: string;
  onRetry: () => void;
  retryLabel: string;
  onLongPress?: (payload: unknown) => void;
}) {
  const reduceMotion = useReducedMotion();
  const lp = useLongPressHandlers({ errorCode, errorMessage }, onLongPress);
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start px-3"
    >
      <div
        className="max-w-[85%] select-none rounded-2xl rounded-bl-md border border-err/40 bg-wf-white px-3 py-2 text-sm text-err"
        {...lp}
      >
        <p className="font-semibold">{errorCode}</p>
        <p className="mt-0.5">{errorMessage}</p>
        <button
          type="button"
          className="mt-2 text-xs font-semibold underline"
          onClick={onRetry}
        >
          {retryLabel}
        </button>
      </div>
    </motion.div>
  );
}

function AssistantBubble({
  message,
  agentCaption,
  onLongPress,
}: {
  message: FargoMessage;
  agentCaption?: string | null;
  onLongPress?: (payload: unknown) => void;
}) {
  const disclosures = message.richMessages.flatMap((r) =>
    r.responseType === 'SYSTEM_MESSAGE' ? r.data.disclosures : [],
  );
  const reduceMotion = useReducedMotion();
  const lp = useLongPressHandlers(message, onLongPress);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-1.5 px-3"
    >
      <div
        className="max-w-[85%] select-none self-start rounded-2xl rounded-bl-md border border-wf-gray-300 bg-wf-white px-3 py-2 text-sm text-wf-ink"
        {...lp}
      >
        <AnnotatedText
          text={message.message}
          annotated={message.messageFormat === 'ANNOTATED'}
        />
      </div>
      {disclosures.length > 0 ? (
        <DisclosureNote disclosures={disclosures} />
      ) : null}
      {agentCaption ? (
        <p className="px-1 text-[11px] text-wf-gray-700">{agentCaption}</p>
      ) : null}
    </motion.div>
  );
}
