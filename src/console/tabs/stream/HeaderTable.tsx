type HeaderTableProps = {
  headers: Record<string, unknown>;
  highlightToken: string | null;
  onTokenClick: (token: string) => void;
};

const LINKABLE = new Set([
  'kafka_correlationId',
  'conversation_id',
  'session_id',
  'chat_message_id',
  'event_id',
  'm2_session_id',
  'cache_key',
]);

export function HeaderTable({
  headers,
  highlightToken,
  onTokenClick,
}: HeaderTableProps) {
  const rows = Object.entries(headers);

  return (
    <div className="overflow-auto rounded border border-wf-gray-300">
      <table className="w-full min-w-[320px] border-collapse text-left text-xs">
        <thead className="bg-wf-cream text-wf-gray-700">
          <tr>
            <th className="sticky top-0 px-2 py-1.5 font-semibold">Key</th>
            <th className="sticky top-0 px-2 py-1.5 font-semibold">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, value]) => {
            const text =
              value === null || value === undefined
                ? String(value)
                : typeof value === 'string'
                  ? value
                  : JSON.stringify(value);
            const linkable = LINKABLE.has(key) && typeof value === 'string';
            const active = linkable && highlightToken === value;

            return (
              <tr key={key} className="border-t border-wf-gray-300/80">
                <td className="whitespace-nowrap px-2 py-1.5 font-mono text-wf-gray-700">
                  {key}
                </td>
                <td className="px-2 py-1.5 font-mono text-wf-ink break-all">
                  {linkable ? (
                    <button
                      type="button"
                      className={`rounded px-1 text-left underline-offset-2 hover:underline ${
                        active
                          ? 'bg-wf-gold/40 font-semibold'
                          : 'text-wf-red'
                      }`}
                      onClick={() => onTokenClick(value)}
                      title="Highlight related stream rows"
                    >
                      {text}
                    </button>
                  ) : (
                    text
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
