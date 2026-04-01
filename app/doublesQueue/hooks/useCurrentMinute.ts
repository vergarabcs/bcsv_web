import { useEffect, useState } from 'react';

export const useCurrentMinute = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 15_000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return now;
};