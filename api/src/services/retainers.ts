import type { Prisma } from "@prisma/client";

import { prisma } from "../db.js";
import { computeRetainerHealth } from "../domain/retainer-health.js";

const retainerWithCheckIns = {
  include: {
    checkIns: {
      orderBy: {
        date: "desc",
      },
      take: 10,
    },
  },
} satisfies Prisma.RetainerDefaultArgs;

const retainerWithHealthCheckIns = {
  include: {
    checkIns: {
      orderBy: {
        date: "desc",
      },
      take: 2,
    },
  },
} satisfies Prisma.RetainerDefaultArgs;

type RetainerWithCheckIns = Prisma.RetainerGetPayload<typeof retainerWithCheckIns>;
type RetainerWithHealthCheckIns = Prisma.RetainerGetPayload<typeof retainerWithHealthCheckIns>;

export class NotFoundError extends Error {
  statusCode = 404;
}

export async function listRetainers() {
  const retainers = await prisma.retainer.findMany({
    ...retainerWithHealthCheckIns,
    orderBy: {
      clientName: "asc",
    },
  });

  return retainers.map(toRetainerSummary);
}

export async function getRetainer(id: string) {
  const retainer = await prisma.retainer.findUnique({
    where: {
      id,
    },
    ...retainerWithCheckIns,
  });

  if (!retainer) {
    throw new NotFoundError("Retainer not found.");
  }

  return toRetainerDetail(retainer);
}

export async function createRetainer(data: Prisma.RetainerCreateInput) {
  const retainer = await prisma.retainer.create({
    data,
    ...retainerWithCheckIns,
  });

  return toRetainerDetail(retainer);
}

export async function createCheckIn(retainerId: string, data: Omit<Prisma.CheckInUncheckedCreateInput, "retainerId">) {
  const retainer = await prisma.retainer.findUnique({
    where: {
      id: retainerId,
    },
    select: {
      id: true,
    },
  });

  if (!retainer) {
    throw new NotFoundError("Retainer not found.");
  }

  const checkIn = await prisma.checkIn.create({
    data: {
      ...data,
      retainerId,
    },
  });

  return toCheckInResponse(checkIn);
}

export async function updateRetainer(id: string, data: Prisma.RetainerUpdateInput) {
  try {
    const retainer = await prisma.retainer.update({
      where: {
        id,
      },
      data,
      ...retainerWithCheckIns,
    });

    return toRetainerDetail(retainer);
  }
  catch (error) {
    if (isRecordNotFound(error)) {
      throw new NotFoundError("Retainer not found.");
    }

    throw error;
  }
}

function toRetainerSummary(retainer: RetainerWithHealthCheckIns) {
  const health = computeRetainerHealth(retainer.checkIns);

  return {
    id: retainer.id,
    clientName: retainer.clientName,
    startDate: retainer.startDate,
    status: retainer.status,
    leadEngineer: retainer.leadEngineer,
    latestCheckInDate: retainer.checkIns[0]?.date ?? null,
    health,
  };
}

function toRetainerDetail(retainer: RetainerWithCheckIns) {
  return {
    ...toRetainerSummary(retainer),
    createdAt: retainer.createdAt,
    updatedAt: retainer.updatedAt,
    checkIns: retainer.checkIns.map(toCheckInResponse),
  };
}

function toCheckInResponse(checkIn: RetainerWithCheckIns["checkIns"][number]) {
  return {
    id: checkIn.id,
    retainerId: checkIn.retainerId,
    date: checkIn.date,
    summary: checkIn.summary,
    ragStatus: checkIn.ragStatus,
    riskNote: checkIn.riskNote,
    createdAt: checkIn.createdAt,
  };
}

function isRecordNotFound(error: unknown) {
  return error instanceof Error && "code" in error && error.code === "P2025";
}
