import { Send } from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';

export function Composer({
  disabled,
  placeholder,
  inputMode,
  onSend,
}: {
  disabled?: boolean;
  placeholder: string;
  inputMode?: string;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState('');

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      className="flex shrink-0 items-center gap-2 border-t border-wf-gray-300 bg-wf-white px-3 py-2"
      onSubmit={submit}
    >
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        inputMode={inputMode === 'FREE_TEXT' ? 'text' : undefined}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        className="min-w-0 flex-1 rounded-full border border-wf-gray-300 bg-wf-cream px-3 py-2 text-sm text-wf-ink placeholder:text-wf-gray-700/70 disabled:opacity-50"
        aria-label={placeholder}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-wf-red text-wf-white disabled:opacity-40"
        aria-label="Send"
      >
        <Send size={16} />
      </button>
    </form>
  );
}
