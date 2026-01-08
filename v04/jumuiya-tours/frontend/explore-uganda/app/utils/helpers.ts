// app/utils/helpers.ts
export const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const debounce = (fn: (...args: any[]) => void, delay = 400) => {
  let timer: number;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
};

export const truncate = (text: string, length = 100) =>
  text.length > length ? `${text.slice(0, length)}…` : text;
