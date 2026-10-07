import { groupCatalog } from '@/mock/demoEvents';
import { EventCard } from './EventCard';

export function EventCatalog() {
  const groups = groupCatalog();

  return (
    <div className="space-y-5">
      {groups.map(({ group, events }) => (
        <section key={group}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-wf-gray-700">
            {group}
          </h3>
          <div className="grid gap-2 lg:grid-cols-2">
            {events.map((def) => (
              <EventCard key={def.key} def={def} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
