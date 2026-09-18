import { createContext, useContext } from 'react';
import type { StreamChat } from 'stream-chat';

type StreamContextValue = {
  client: StreamChat | null;
  loading: boolean;
  error: string;
};

export const StreamContext = createContext<StreamContextValue>({ client: null, loading: false, error: '' });

export function useAthzyStream() {
  return useContext(StreamContext);
}
