import { format, parseISO } from 'date-fns';

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy HH:mm:ss');
  } catch (error) {
    return 'Invalid Date';
  }
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
