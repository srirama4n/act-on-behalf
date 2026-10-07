import { Info, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDialog } from '@/a11y/useDialog';
import { t } from '@/i18n';
import {
  selectActiveQrb,
  selectComposerEnabled,
  useChatStore,
} from '@/store/chat';
import { useSettingsStore } from '@/store/settings';
import { Composer } from '@/phone/chat/Composer';
import { MessageBubble } from '@/phone/chat/MessageBubble';
import { MessageJsonSheet } from '@/phone/chat/MessageJsonSheet';
import { QrbChips } from '@/phone/chat/QrbChips';
import { TypingDots } from '@/phone/chat/TypingDots';

export function ChatScreen() {
  const language = useSettingsStore((s) => s.language);
  const showJsonOnLongPress = useSettingsStore((s) => s.showJsonOnLongPress);
  const copy = t(language);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [jsonPayload, setJsonPayload] = useState<unknown | null>(null);

  const items = useChatStore((s) => s.items);
  const awaiting = useChatStore((s) => s.awaiting);
  const initialized = useChatStore((s) => s.initialized);
  const toast = useChatStore((s) => s.toast);
  const disclosureOpen = useChatStore((s) => s.disclosureOpen);
  const lastDisclosure = useChatStore((s) => s.lastDisclosure);
  const sendInit = useChatStore((s) => s.sendInit);
  const sendText = useChatStore((s) => s.sendText);
  const sendQrb = useChatStore((s) => s.sendQrb);
  const sendExit = useChatStore((s) => s.sendExit);
  const retry = useChatStore((s) => s.retry);
  const clearToast = useChatStore((s) => s.clearToast);
  const setDisclosureOpen = useChatStore((s) => s.setDisclosureOpen);

  const closeDisclosure = useCallback(() => setDisclosureOpen(false), [setDisclosureOpen]);
  const closeJson = useCallback(() => setJsonPayload(null), []);
  useDialog({ open: disclosureOpen, onClose: closeDisclosure });
  useDialog({ open: jsonPayload != null, onClose: closeJson });

  useEffect(() => {
    if (!initialized && !awaiting) {
      void sendInit();
    }
  }, [initialized, awaiting, sendInit]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items, awaiting]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => clearToast(), 2200);
    return () => window.clearTimeout(id);
  }, [toast, clearToast]);

  const qrb = selectActiveQrb(items);
  const composerEnabled = selectComposerEnabled(items) && !awaiting;
  const lastAssistant = [...items].reverse().find((i) => i.kind === 'assistant');
  const inputFormat =
    lastAssistant?.kind === 'assistant'
      ? lastAssistant.message.inputFormat
      : 'FREE_TEXT';

  const onLongPress = showJsonOnLongPress
    ? (payload: unknown) => setJsonPayload(payload)
    : undefined;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-wf-cream">
      <header className="flex shrink-0 items-start justify-between border-b-2 border-wf-gold bg-wf-red px-3 py-2.5">
        <div>
          <p className="text-sm font-bold text-wf-white">Fargo</p>
          <p className="text-xs text-wf-white/85">{copy.chatSubtitle}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded p-1.5 text-wf-white hover:bg-wf-red-dark"
            aria-label={copy.disclosureTitle}
            onClick={() => setDisclosureOpen(true)}
          >
            <Info size={18} />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-wf-white hover:bg-wf-red-dark"
            aria-label={copy.close}
            onClick={() => void sendExit()}
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto py-3">
        {items.map((item) => {
          if (item.kind === 'user') {
            return (
              <MessageBubble
                key={item.id}
                role="user"
                text={item.text}
                onLongPress={onLongPress}
              />
            );
          }
          if (item.kind === 'error') {
            return (
              <MessageBubble
                key={item.id}
                role="error"
                errorCode={item.errorCode}
                errorMessage={item.errorMessage}
                retryLabel={copy.retry}
                onRetry={() => void retry(item.id)}
                onLongPress={onLongPress}
              />
            );
          }
          const agentName =
            item.agentInfo &&
            typeof item.agentInfo === 'object' &&
            item.agentInfo !== null &&
            'name' in item.agentInfo
              ? String((item.agentInfo as { name: unknown }).name)
              : null;
          return (
            <MessageBubble
              key={item.id}
              role="assistant"
              message={item.message}
              agentCaption={
                agentName ? `${copy.handledBy} ${agentName}` : null
              }
              onLongPress={onLongPress}
            />
          );
        })}
        {awaiting ? <TypingDots /> : null}
      </div>

      {qrb ? (
        <QrbChips
          buttons={qrb.buttons}
          disabled={awaiting}
          onSelect={(button) => void sendQrb(button, qrb.systemMessageId)}
        />
      ) : null}

      <Composer
        disabled={!composerEnabled}
        placeholder={copy.composerPlaceholder}
        inputMode={inputFormat}
        onSend={(text) => void sendText(text)}
      />

      {toast ? (
        <div
          className="pointer-events-none absolute inset-x-4 bottom-24 rounded-lg bg-wf-ink/90 px-3 py-2 text-center text-xs font-medium text-wf-white"
          role="status"
        >
          {toast}
        </div>
      ) : null}

      {disclosureOpen ? (
        <div
          className="absolute inset-0 z-20 flex items-end bg-wf-ink/40 p-3"
          role="presentation"
          onClick={closeDisclosure}
        >
          <div
            role="dialog"
            aria-modal
            aria-label={copy.disclosureTitle}
            className="w-full rounded-xl bg-wf-white p-4 shadow-phone"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{copy.disclosureTitle}</h2>
              <button
                type="button"
                className="rounded text-sm text-wf-gray-700"
                onClick={closeDisclosure}
                autoFocus
              >
                {copy.close}
              </button>
            </div>
            <p className="text-xs leading-relaxed text-wf-gray-700">
              {lastDisclosure ?? copy.noDisclosure}
            </p>
          </div>
        </div>
      ) : null}

      {jsonPayload != null ? (
        <MessageJsonSheet data={jsonPayload} onClose={closeJson} />
      ) : null}
    </div>
  );
}
