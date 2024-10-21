import { format, parseISO } from 'date-fns';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy HH:mm:ss');
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatDateWithTimezone = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  return dayjs.utc(dateString).local().format('YYYY-MM-DD HH:mm:ss');
};

export const defineCron = (cronExpression: string): string => {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) {
    return 'Invalid cron expression';
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  let description = 'Runs ';

  if (minute === '*') {
    description += 'every minute';
  } else {
    description += `at minute ${minute}`;
  }

  if (hour === '*') {
    description += ' of every hour';
  } else {
    description += ` of hour ${hour}`;
  }

  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    description += ' every day';
  } else if (dayOfMonth !== '*') {
    description += ` on day ${dayOfMonth} of the month`;
  } else if (dayOfWeek !== '*') {
    description += ` on ${dayOfWeek} of the week`;
  }

  if (month !== '*') {
    description += ` in month ${month}`;
  }

  return description;
};

export const formatDuration = (start: Date, end: Date): string => {
  const diff = Math.abs(end.getTime() - start.getTime());
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
};
