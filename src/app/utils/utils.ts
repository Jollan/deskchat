import { upperFirst } from 'lodash-es';

export const removeExtraWhiteSpace = (value: string) => {
  return value
    .split(' ')
    .filter((sub) => sub.trim())
    .join(' ');
};

export const title = (value: string) => {
  return value
    .split(' ')
    .filter((sub) => sub.trim())
    .map((sub) => upperFirst(sub))
    .join(' ');
};

export function isEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
