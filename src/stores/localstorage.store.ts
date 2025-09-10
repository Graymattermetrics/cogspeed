export function saveSleepData(sleepData: Record<string, any>): void {
  try {
    sleepData["date_"] = new Date();
    const existing = localStorage.getItem("sleepdata");
    const sleepdatas: Record<string, any>[] = existing ? JSON.parse(existing) : [];

    sleepdatas.push(sleepData);
    localStorage.setItem("sleepdata", JSON.stringify(sleepdatas));
  } catch (err) {
    console.error("Error saving sleepdata", err);
  }
}

export function loadLatestSleepData<T extends { date_: string } = any>(): T | null {
  try {
    const existing = localStorage.getItem("sleepdata");
    if (!existing) return null;

    const sleepdatas: T[] = JSON.parse(existing);

    if (sleepdatas.length === 0) return null;

    return sleepdatas.reduce((latest, current) =>
      new Date(current.date_) > new Date(latest.date_) ? current : latest
    );
  } catch (err) {
    console.error("Error loading sleepdata", err);
    return null;
  }
}

export function isSleepDataOlderThanOneHour(latestSleepData: {date_: string}): boolean {
  const latestDate = new Date(latestSleepData.date_);
  const now = new Date();

  const diffMs = now.getTime() - latestDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours > 1;
}