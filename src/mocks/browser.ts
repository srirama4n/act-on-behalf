import { setupWorker } from 'msw/browser';
import { chatHandlers } from './chatHandlers';

export const worker = setupWorker(...chatHandlers);
