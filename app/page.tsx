'use client';

import { WorkspaceProvider } from './context/WorkspaceContext';
import AppShell from './components/AppShell';

export default function Home() {
  return (
    <WorkspaceProvider>
      <AppShell />
    </WorkspaceProvider>
  );
}
