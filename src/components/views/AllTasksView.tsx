import React from 'react';
import { TaskList } from '../tasks/TaskList';
import { SortToolbar } from '../tasks/SortToolbar';

export function AllTasksView() {
  return (
    <div className="content-area">
      <SortToolbar />
      <TaskList />
    </div>
  );
}
