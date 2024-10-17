import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const formatDate = (dateString: string) => {
  const date = parseISO(dateString);
  const zonedDate = toZonedTime(date, 'Asia/Ho_Chi_Minh');
  return format(zonedDate, 'yyyy/MM/dd HH:mm:ss');
};

export const defineCron = (cronExpression: string): string => {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) {
    return 'Invalid Cron expression';
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  let definition = '';

  if (minute === '*') {
    definition += 'Every minute ';
  } else {
    definition += `At minute ${minute} `;
  }

  if (hour === '*') {
    definition += 'of every hour ';
  } else {
    definition += `of hour ${hour} `;
  }

  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    definition += 'every day';
  } else {
    if (dayOfMonth !== '*') {
      definition += `on day ${dayOfMonth} of the month `;
    }
    if (month !== '*') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      definition += `in ${monthNames[parseInt(month) - 1]} `;
    }
    if (dayOfWeek !== '*') {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      definition += `on ${dayNames[parseInt(dayOfWeek)]}`;
    }
  }

  return `${definition.trim()} (UTC+0)`;
};
