import { CustomerContextForm } from './CustomerContextForm';
import { SessionInfo } from './SessionInfo';

export function ContextTab() {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
      <CustomerContextForm />
      <SessionInfo />
    </div>
  );
}
