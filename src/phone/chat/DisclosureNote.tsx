import { useState } from 'react';
import type { Disclosure } from '@/contracts/chatService';
import { t } from '@/i18n';
import { useSettingsStore } from '@/store/settings';

const COLLAPSE_AT = 120;

export function DisclosureNote({
  disclosures,
}: {
  disclosures: Disclosure[];
}) {
  const language = useSettingsStore((s) => s.language);
  const copy = t(language);
  const text = disclosures.map((d) => d.text).join('\n\n');
  const long = text.length > COLLAPSE_AT;
  const [expanded, setExpanded] = useState(false);
  const shown =
    !long || expanded ? text : `${text.slice(0, COLLAPSE_AT).trimEnd()}…`;

  return (
    <div
      className="max-w-[85%] self-start px-1 text-[11px] leading-snug text-wf-gray-700"
      data-testid="disclosure-note"
    >
      <p>{shown}</p>
      {long ? (
        <button
          type="button"
          className="mt-0.5 font-semibold text-wf-ink underline"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? copy.showLess : copy.showMore}
        </button>
      ) : null}
    </div>
  );
}
