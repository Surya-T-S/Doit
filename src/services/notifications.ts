/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[Notifications] Not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Send a browser notification
 */
export function sendNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  } catch (error) {
    console.error('[Notifications] Failed to send:', error);
  }
}

/**
 * Check for tasks with upcoming reminders.
 * Returns a cleanup function to stop checking.
 */
export function startReminderChecker(
  getTasks: () => { dueDate: string | null; dueTime: string | null; title: string; status: string }[],
  intervalMs = 60000
): () => void {
  const checkReminders = () => {
    const tasks = getTasks();
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];
    const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    tasks.forEach((task) => {
      if (task.status !== 'pending') return;
      if (task.dueDate === nowStr && task.dueTime === nowTime) {
        sendNotification(`Task Due: ${task.title}`, {
          body: 'This task is due now.',
          tag: `task-${task.title}`, // Prevent duplicates
        });
      }
    });
  };

  const intervalId = setInterval(checkReminders, intervalMs);
  return () => clearInterval(intervalId);
}
