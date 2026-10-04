import { differenceInYears, format, parseISO } from 'date-fns';

export const formatDate = (iso: string) => format(parseISO(iso), 'd MMM yyyy');

export const ageFrom = (dateOfBirth: string) =>
  differenceInYears(new Date(), parseISO(dateOfBirth));

const numberFormat = new Intl.NumberFormat('en-US');
export const formatNumber = (value: number) => numberFormat.format(value);

export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
const compactFormat = new Intl.NumberFormat('en-US', { notation: 'compact' });
/** 1200 -> "1.2K": axis labels stay short so they never get clipped. */
export const formatCompact = (value: number) => compactFormat.format(value);
