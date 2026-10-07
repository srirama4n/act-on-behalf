import type { ReactNode } from 'react';

/**
 * Minimal ANNOTATED renderer: **bold**, [label](url), and safe strip of unknown tags.
 * Unknown markup is ignored rather than executed.
 */
export function AnnotatedText({
  text,
  annotated,
}: {
  text: string;
  annotated: boolean;
}) {
  const lines = text.split('\n');
  return (
    <div className="whitespace-pre-wrap break-words">
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 ? <br /> : null}
          {annotated ? renderInline(line) : line}
        </span>
      ))}
    </div>
  );
}

function renderInline(line: string): ReactNode[] {
  const cleaned = line.replace(/<\/?[a-zA-Z][^>]*>/g, '');
  const nodes: ReactNode[] = [];
  const tokenRe = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = tokenRe.exec(cleaned)) !== null) {
    if (match.index > last) {
      nodes.push(cleaned.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={key++} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (m) {
        nodes.push(
          <a
            key={key++}
            href={m[2]}
            className="underline decoration-wf-gold underline-offset-2"
            onClick={(e) => e.preventDefault()}
          >
            {m[1]}
          </a>,
        );
      }
    }
    last = match.index + token.length;
  }
  if (last < cleaned.length) nodes.push(cleaned.slice(last));
  return nodes;
}
