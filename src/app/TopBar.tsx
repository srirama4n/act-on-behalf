type TopBarProps = {
  env: 'MOCK' | 'RQA';
  language: 'es' | 'en';
  presenterMode?: boolean;
  onLanguageChange: (lang: 'es' | 'en') => void;
};

export function TopBar({
  env,
  language,
  presenterMode,
  onLanguageChange,
}: TopBarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-wf-gray-300 bg-wf-white px-4">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-tight text-wf-ink">
          Fargo Demo Workbench · Personal Agents
        </h1>
        <span
          className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            env === 'MOCK'
              ? 'bg-wf-cream text-wf-gray-700'
              : 'bg-wf-red/10 text-wf-red'
          }`}
        >
          {env}
        </span>
        {presenterMode ? (
          <span className="rounded bg-wf-gold/50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-wf-ink">
            Presenter
          </span>
        ) : null}
      </div>

      <div
        className="inline-flex rounded border border-wf-gray-300 p-0.5"
        role="group"
        aria-label="Language"
      >
        {(['es', 'en'] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => onLanguageChange(lang)}
            className={`rounded px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
              language === lang
                ? 'bg-wf-red text-wf-white'
                : 'text-wf-gray-700 hover:bg-wf-cream'
            }`}
            aria-pressed={language === lang}
          >
            {lang}
          </button>
        ))}
      </div>
    </header>
  );
}
