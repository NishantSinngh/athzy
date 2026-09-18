import React, { PropsWithChildren } from 'react';
import { StreamContext } from './StreamContext';

export function StreamProvider({ children }: PropsWithChildren<{ userId: string }>) {
  return <StreamContext.Provider value={{ client: null, loading: false, error: 'Chat is available in the Athzy iOS and Android apps.' }}>{children}</StreamContext.Provider>;
}
