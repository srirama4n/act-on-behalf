import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkbenchLayout } from '@/app/WorkbenchLayout';
import { ActivityScreen } from '@/features/activity/ActivityScreen';
import { AgentDetailScreen } from '@/features/agents/AgentDetailScreen';
import { AgentsScreen } from '@/features/agents/AgentsScreen';
import { ApprovalScreen } from '@/features/approvals/ApprovalScreen';
import { ChatScreen } from '@/features/chat/ChatScreen';
import { HomeScreen } from '@/features/home/HomeScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<WorkbenchLayout />}>
            <Route index element={<HomeScreen />} />
            <Route path="assistant" element={<ChatScreen />} />
            <Route path="agents" element={<AgentsScreen />} />
            <Route path="agents/:agentId" element={<AgentDetailScreen />} />
            <Route path="approvals/:approvalId" element={<ApprovalScreen />} />
            <Route path="activity" element={<ActivityScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
