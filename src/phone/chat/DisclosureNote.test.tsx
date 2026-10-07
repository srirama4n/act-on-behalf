import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DisclosureNote } from './DisclosureNote';

describe('DisclosureNote', () => {
  it('renders disclosure text', () => {
    render(
      <DisclosureNote
        disclosures={[
          {
            type: 'PLAIN',
            disclosureType: 'DISCLOSURE-1C',
            text: 'Fargo es su asistente de IA.',
          },
        ]}
      />,
    );
    expect(screen.getByTestId('disclosure-note')).toHaveTextContent(
      'Fargo es su asistente de IA.',
    );
  });

  it('expands long disclosure on demand', async () => {
    const user = userEvent.setup();
    const long = 'A'.repeat(200);
    render(
      <DisclosureNote
        disclosures={[
          { type: 'PLAIN', disclosureType: 'DISCLOSURE-1C', text: long },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Ver más' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver más' }));
    expect(screen.getByTestId('disclosure-note')).toHaveTextContent(long);
  });
});
