import React from 'react';
import { CheckCircle2, Inbox, Search } from 'lucide-react';

interface EmptyStateProps {
  type: 'pending' | 'completed' | 'filtered' | 'search' | 'today' | 'calendar';
}

const MESSAGES: Record<string, { icon: React.ReactNode; text: string }> = {
  pending: {
    icon: <Inbox />,
    text: 'Nothing here yet. Press N or start typing to add your first task.',
  },
  completed: {
    icon: <CheckCircle2 />,
    text: 'Nothing completed yet. One step at a time.',
  },
  filtered: {
    icon: <Inbox />,
    text: 'No tasks match this filter.',
  },
  search: {
    icon: <Search />,
    text: 'No results found.',
  },
  today: {
    icon: <CheckCircle2 />,
    text: 'Nothing planned for today. Enjoy the calm.',
  },
  calendar: {
    icon: <Inbox />,
    text: 'No tasks scheduled for this date.',
  },
};

export function EmptyState({ type }: EmptyStateProps) {
  const config = MESSAGES[type];

  return (
    <div className="empty-state" role="status">
      <div className="empty-state-icon">{config.icon}</div>
      <p className="empty-state-text">{config.text}</p>
    </div>
  );
}
