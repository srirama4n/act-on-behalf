import { useEffect, useRef, useState } from 'react';
import { publishDemoEvent } from '@/mock/engine';
import { SCENARIOS, type Scenario } from '@/mock/scenarios';

export function ScenarioRunner() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0]?.id ?? '');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  useEffect(() => {
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, []);

  const runStep = (s: Scenario, index: number) => {
    const item = s.steps[index];
    if (!item) {
      setPlaying(false);
      return;
    }
    publishDemoEvent(item.key, item.params ?? {});
    setStep(index + 1);
  };

  const play = () => {
    if (!scenario) return;
    setPlaying(true);
    const start = step >= scenario.steps.length ? 0 : step;
    if (step >= scenario.steps.length) setStep(0);

    const tick = (index: number) => {
      if (index >= scenario.steps.length) {
        setPlaying(false);
        return;
      }
      runStep(scenario, index);
      const delay = scenario.steps[index]?.delayMs ?? 600;
      timer.current = window.setTimeout(() => tick(index + 1), delay);
    };
    tick(start);
  };

  const pause = () => {
    setPlaying(false);
    if (timer.current != null) window.clearTimeout(timer.current);
  };

  const next = () => {
    if (!scenario || step >= scenario.steps.length) return;
    runStep(scenario, step);
  };

  return (
    <div className="rounded-lg border border-wf-gray-300 bg-wf-white p-3">
      <h3 className="text-sm font-semibold">Scenario runner</h3>
      <p className="mt-0.5 text-xs text-wf-gray-700">
        Scripted sequences with step-through controls.
      </p>

      <label className="mt-2 block text-[11px] font-semibold text-wf-gray-700">
        Scenario
        <select
          value={scenario?.id}
          onChange={(e) => {
            setScenarioId(e.target.value);
            setStep(0);
            pause();
          }}
          className="mt-0.5 w-full rounded border border-wf-gray-300 px-2 py-1.5 text-xs text-wf-ink"
        >
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>

      {scenario ? (
        <p className="mt-1 text-xs text-wf-gray-700">{scenario.description}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={playing}
          onClick={play}
          className="rounded bg-wf-red px-2.5 py-1.5 text-xs font-semibold text-wf-white disabled:opacity-40"
        >
          ▶ Play
        </button>
        <button
          type="button"
          onClick={pause}
          className="rounded border border-wf-gray-300 px-2.5 py-1.5 text-xs font-semibold"
        >
          ⏸ Pause
        </button>
        <button
          type="button"
          disabled={playing || !scenario || step >= scenario.steps.length}
          onClick={next}
          className="rounded border border-wf-gray-300 px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          ⏭ Next
        </button>
        <span className="self-center text-[11px] text-wf-gray-700">
          Step {Math.min(step + 1, scenario?.steps.length ?? 0)} /{' '}
          {scenario?.steps.length ?? 0}
        </span>
      </div>

      <ol className="mt-2 space-y-1 text-xs text-wf-gray-700">
        {scenario?.steps.map((s, i) => (
          <li
            key={`${s.key}-${i}`}
            className={i < step ? 'text-ok' : i === step ? 'font-semibold text-wf-ink' : ''}
          >
            {i + 1}. {s.label}
          </li>
        ))}
      </ol>
    </div>
  );
}
