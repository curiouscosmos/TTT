export type RagStatus = "green" | "amber" | "red";

export type RetainerHealth = {
  status: RagStatus;
  reason: string;
};

export type RetainerHealthCheckIn = {
  date: Date | string;
  ragStatus: RagStatus;
};

const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

export function computeRetainerHealth(
  checkIns: readonly RetainerHealthCheckIn[],
  currentDate = new Date(),
): RetainerHealth {
  if (checkIns.length === 0) {
    return {
      status: "red",
      reason: "No check-ins have been recorded yet.",
    };
  }

  const sortedCheckIns = [...checkIns].sort((a, b) => dateMs(b.date) - dateMs(a.date));
  const [latest, previous] = sortedCheckIns;

  if (latest.ragStatus === "red") {
    return {
      status: "red",
      reason: "The most recent check-in is red.",
    };
  }

  if (dateMs(currentDate) - dateMs(latest.date) > fourteenDaysMs) {
    return {
      status: "red",
      reason: "No check-in has been recorded in the past 14 days.",
    };
  }

  if (latest.ragStatus === "amber" || previous?.ragStatus === "amber") {
    return {
      status: "amber",
      reason: "One of the two most recent check-ins is amber.",
    };
  }

  return {
    status: "green",
    reason: "Recent check-ins are green.",
  };
}

function dateMs(date: Date | string) {
  return new Date(date).getTime();
}
