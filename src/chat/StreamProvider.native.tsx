import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { isRunningInExpoGo } from 'expo';
import { BackendAPI } from '../api/backend';
import { StreamContext } from './StreamContext';

const streamChat = isRunningInExpoGo() ? null : require('stream-chat-expo') as typeof import('stream-chat-expo');

type ChatCredentials = {
  apiKey: string;
  token: string;
  user: { id: string; name?: string; image?: string };
};

function ConnectedStream({ credentials, children }: PropsWithChildren<{ credentials: ChatCredentials }>) {
  const { Chat, OverlayProvider, useCreateChatClient } = streamChat!;
  const [timedOut, setTimedOut] = useState(false);
  const initialToken = useRef(credentials.token);
  const tokenProvider = useCallback(async () => {
    if (initialToken.current) {
      const token = initialToken.current;
      initialToken.current = '';
      return token;
    }
    const refreshed = await BackendAPI.getChatToken();
    return refreshed.token;
  }, []);
  const client = useCreateChatClient({
    apiKey: credentials.apiKey,
    tokenOrProvider: tokenProvider,
    userData: credentials.user,
  });

  useEffect(() => {
    if (client) return;
    const timeout = setTimeout(() => setTimedOut(true), 12000);
    return () => clearTimeout(timeout);
  }, [client]);

  if (!client) {
    return <StreamContext.Provider value={{ client: null, loading: !timedOut, error: timedOut ? 'Chat could not connect. Check your network and try again from Chat.' : '' }}>{children}</StreamContext.Provider>;
  }

  return (
    <StreamContext.Provider value={{ client, loading: false, error: '' }}>
      <OverlayProvider><Chat client={client}>{children}</Chat></OverlayProvider>
    </StreamContext.Provider>
  );
}

function NativeStreamProvider({ children, userId }: PropsWithChildren<{ userId: string }>) {
  const [credentials, setCredentials] = useState<ChatCredentials | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => { if (active) setError('Chat could not connect. Check your network and try again from Chat.'); }, 12000);
    setCredentials(null);
    setError('');
    BackendAPI.getChatToken()
      .then((result) => { if (active) setCredentials(result); })
      .catch((requestError: Error) => { if (active) setError(requestError.message); });
    return () => { active = false; clearTimeout(timeout); };
  }, [userId]);

  if (credentials) return <ConnectedStream credentials={credentials}>{children}</ConnectedStream>;
  return <StreamContext.Provider value={{ client: null, loading: !error, error }}>{children}</StreamContext.Provider>;
}

export function StreamProvider(props: PropsWithChildren<{ userId: string }>) {
  if (!streamChat) return <StreamContext.Provider value={{ client: null, loading: false, error: 'Realtime chat requires an Athzy development or preview build.' }}>{props.children}</StreamContext.Provider>;
  return <NativeStreamProvider {...props} />;
}
