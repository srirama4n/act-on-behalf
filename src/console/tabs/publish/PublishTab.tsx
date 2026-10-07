import { useSettingsStore } from '@/store/settings';
import { CustomEventEditor } from './CustomEventEditor';
import { EventCatalog } from './EventCatalog';
import { ScenarioRunner } from './ScenarioRunner';

export function PublishTab() {
  const presenterMode = useSettingsStore((s) => s.presenterMode);

  return (
    <div className="space-y-4">
      <div
        className={`grid gap-3 ${presenterMode ? '' : 'lg:grid-cols-2'}`}
      >
        <ScenarioRunner />
        {!presenterMode ? <CustomEventEditor /> : null}
      </div>
      <EventCatalog />
    </div>
  );
}
