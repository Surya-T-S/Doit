import React from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatDuration } from '../../utils/dates';

export function DayCapacityBar() {
  const dailyCapacity = useSettingsStore((s) => s.dailyCapacityMinutes);
  const totalEstimated = useTaskStore((s) => s.getTotalEstimatedMinutes());
  const completedEstimated = useTaskStore((s) => s.getCompletedEstimatedMinutes());

  if (totalEstimated === 0) return null;

  const percentage = Math.min((totalEstimated / dailyCapacity) * 100, 100);
  const overloadRatio = totalEstimated / dailyCapacity;

  let fillClass = '';
  if (overloadRatio > 1.5) fillClass = 'critical';
  else if (overloadRatio > 1) fillClass = 'overloaded';

  let hint = '';
  if (overloadRatio > 1.5) {
    hint = `That's quite a lot. Consider moving some tasks to another day.`;
  } else if (overloadRatio > 1) {
    hint = `Slightly over capacity — prioritize what matters most.`;
  }

  return (
    <div className="capacity-bar" role="status" aria-label="Day capacity">
      <div className="capacity-header">
        <span className="capacity-label">Day capacity</span>
        <span className="capacity-value">
          {formatDuration(totalEstimated)} planned · {formatDuration(dailyCapacity)} available
        </span>
      </div>
      <div className="capacity-track">
        <div
          className={`capacity-fill ${fillClass}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {hint && <p className="capacity-hint">{hint}</p>}
    </div>
  );
}
