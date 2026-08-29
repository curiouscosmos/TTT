import { existsSync } from "node:fs";
import process from "node:process";

const RETAINER_COUNT = 300;
const RECENT_DAYS_AGO = 5;
const STALE_DAYS_AGO = 21;

const clientPrefixes = [
  "Northstar",
  "Bluebird",
  "Pioneer",
  "Summit",
  "Riverstone",
  "Brightline",
  "Evergreen",
  "Silver Oak",
  "Atlas",
  "Harbor",
  "Maple",
  "Cedar",
  "Ironwood",
  "Redwood",
  "Keystone",
  "Acme",
  "Nimbus",
  "Catalyst",
  "Meridian",
  "Waypoint",
] as const;

const clientSuffixes = [
  "Health",
  "Logistics",
  "Finance",
  "Retail",
  "Analytics",
  "Labs",
  "Systems",
  "Partners",
  "Foods",
  "Energy",
  "Education",
  "Cloud",
  "Media",
  "Insurance",
  "Works",
] as const;

const leadEngineers = [
  "Avery Chen",
  "Maya Patel",
  "Jordan Lee",
  "Sam Rivera",
  "Taylor Brooks",
  "Priya Shah",
  "Noah Kim",
  "Nina Torres",
  "Ethan Wright",
  "Lena Ortiz",
  "Chris Morgan",
  "Iris Campbell",
] as const;

const greenSummaries = [
  "Delivery is on track and stakeholders are aligned.",
  "Weekly goals were met with no major blockers.",
  "Client feedback is positive and backlog health is stable.",
  "Support volume is low and roadmap work is progressing.",
] as const;

const amberSummaries = [
  "A dependency delay may affect next week's delivery.",
  "Scope needs clarification before the next milestone.",
  "Stakeholder availability is slowing decisions.",
  "A production issue was contained but needs follow-up.",
] as const;

const redSummaries = [
  "Critical delivery risk requires immediate escalation.",
  "A blocking incident is affecting client confidence.",
  "Timeline is at risk without leadership intervention.",
] as const;

const riskNotes = [
  "Waiting on client decision.",
  "Needs senior engineering review.",
  "External dependency remains unresolved.",
  "Escalation scheduled with stakeholders.",
] as const;

type RagStatus = "green" | "amber" | "red";
type HealthBucket = "green" | "amberLatest" | "amberPrevious" | "redLatest" | "stale";

let prisma: typeof import("../src/db.js").prisma | undefined;

function createRandom(seed: number) {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const random = createRandom(20260829);

function pick<T>(values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]!;
}

function daysAgo(anchorDate: Date, days: number) {
  const date = new Date(anchorDate);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function healthBucket(index: number): HealthBucket {
  if (index < 140) {
    return "green";
  }

  if (index < 190) {
    return "amberLatest";
  }

  if (index < 230) {
    return "amberPrevious";
  }

  if (index < 270) {
    return "redLatest";
  }

  return "stale";
}

function checkInStatus(bucket: HealthBucket, checkInIndex: number, lastCheckInIndex: number): RagStatus {
  if (bucket === "redLatest" && checkInIndex === lastCheckInIndex) {
    return "red";
  }

  if (bucket === "amberLatest" && checkInIndex === lastCheckInIndex) {
    return "amber";
  }

  if (bucket === "amberPrevious" && checkInIndex === lastCheckInIndex - 1) {
    return "amber";
  }

  if (bucket === "stale" && checkInIndex === lastCheckInIndex && random() < 0.25) {
    return "amber";
  }

  return "green";
}

function summaryFor(status: RagStatus) {
  if (status === "red") {
    return pick(redSummaries);
  }

  if (status === "amber") {
    return pick(amberSummaries);
  }

  return pick(greenSummaries);
}

async function main() {
  if (existsSync(".env")) {
    process.loadEnvFile(".env");
  }

  const { prisma: db } = await import("../src/db.js");
  prisma = db;

  const anchorDate = startOfUtcDay(new Date());

  await db.checkIn.deleteMany();
  await db.retainer.deleteMany();

  for (let index = 0; index < RETAINER_COUNT; index += 1) {
    const bucket = healthBucket(index);
    const checkInCount = 6 + Math.floor(random() * 9);
    const latestCheckInDate = daysAgo(anchorDate, bucket === "stale" ? STALE_DAYS_AGO + Math.floor(random() * 21) : RECENT_DAYS_AGO + Math.floor(random() * 4));
    const firstCheckInDate = daysAgo(latestCheckInDate, (checkInCount - 1) * 7);
    const startDate = daysAgo(firstCheckInDate, 30 + Math.floor(random() * 700));
    const clientName = `${pick(clientPrefixes)} ${pick(clientSuffixes)} ${index + 1}`;

    await db.retainer.create({
      data: {
        clientName,
        leadEngineer: pick(leadEngineers),
        startDate,
        status: index % 5 === 0 ? "archived" : "active",
        checkIns: {
          create: Array.from({ length: checkInCount }, (_, checkInIndex) => {
            const ragStatus = checkInStatus(bucket, checkInIndex, checkInCount - 1);

            return {
              date: addDays(firstCheckInDate, checkInIndex * 7),
              ragStatus,
              riskNote: ragStatus === "green" ? null : pick(riskNotes),
              summary: summaryFor(ragStatus),
            };
          }),
        },
      },
    });
  }

  await db.$disconnect();

  console.log(`Seeded ${RETAINER_COUNT} retainers with deterministic check-in history.`);
}

main().catch(async (error: unknown) => {
  console.error(error);

  await prisma?.$disconnect();
  process.exit(1);
});
