import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { INITIAL_ACCOUNTS } from '@/mock/accounts';
import { useAccountsStore } from '@/store/accounts';
import { useSettingsStore } from '@/store/settings';
import { SettingsForm } from './SettingsForm';

describe('SettingsForm', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings();
    useSettingsStore.getState().setDemoPacing(false);
    useAccountsStore.getState().resetAccounts();
  });

  it('toggles presenter mode and resets demo accounts', async () => {
    const user = userEvent.setup();
    useAccountsStore.getState().creditChecking(100, 'test');
    render(<SettingsForm />);

    await user.click(
      screen.getByRole('checkbox', {
        name: /presenter mode/i,
      }),
    );
    expect(useSettingsStore.getState().presenterMode).toBe(true);

    await user.click(screen.getByRole('button', { name: /reset demo/i }));
    expect(
      await screen.findByTestId('reset-status'),
    ).toHaveTextContent(/reset in/i);
    expect(useAccountsStore.getState().checking).toBe(INITIAL_ACCOUNTS.checking);
    expect(useSettingsStore.getState().presenterMode).toBe(false);
  });
});

