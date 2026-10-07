import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { QrbButton } from '@/contracts/chatService';
import { emptyChannelData } from '@/contracts/builders';
import { QrbChips } from './QrbChips';

function button(title: string, id: string): QrbButton {
  return {
    type: 'SIMPLE',
    orientation: null,
    navigationInfo: null,
    alignment: null,
    additionalInfo: null,
    channelData: {
      ...emptyChannelData({
        title,
        goldenUtterance: title,
        custom: { uiElementID: id },
      }),
      title,
      custom: { uiElementID: id },
    },
    styleAttributes: null,
  };
}

describe('QrbChips', () => {
  it('renders chip titles and notifies on select', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const buttons = [
      button('¿Cuál es mi saldo?', 'qrb.WhatsMyBalance'),
      button('¿Cómo son mis gastos?', 'qrb.HowsMySpending'),
    ];

    render(<QrbChips buttons={buttons} onSelect={onSelect} />);

    expect(screen.getByTestId('qrb-chips')).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: '¿Cuál es mi saldo?' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);

    await user.click(
      screen.getByRole('option', { name: '¿Cuál es mi saldo?' }),
    );
    expect(onSelect).toHaveBeenCalledWith(buttons[0]);
  });
});
