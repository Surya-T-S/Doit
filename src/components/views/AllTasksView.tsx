import React from 'react';
import { QuickEntry } from '../tasks/QuickEntry';
import { TaskList } from '../tasks/TaskList';
import { SortToolbar } from '../tasks/SortToolbar';

export function AllTasksView() {
  return (
    <div className="content-area">
      <QuickEntry />
      <SortToolbar />
      <TaskList />
    </div>
  );
}
