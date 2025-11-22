import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TestResourceIds {
  facilityId?: string | null;
  serviceId?: string | null;
}

/**
 * Return representative resource IDs for a tenant so tests can use concrete routes.
 */
export async function fetchTestResourceIds(tenantId: string): Promise<TestResourceIds> {
  try {
    const facility = await prisma.facility.findFirst({ where: { tenantId }, select: { id: true } });
    // serviceOffering was used in seed; attempt to find one
    let service: { id: string } | null = null;
    try {
      service = await prisma.serviceOffering.findFirst({ where: { tenantId }, select: { id: true } });
    } catch (e) {
      // model might not exist in some schemas; ignore
      service = null;
    }

    return {
      facilityId: facility?.id ?? null,
      serviceId: service?.id ?? null,
    };
  } catch (error) {
    console.warn('fetchTestResourceIds failed:', (error as any).message || error);
    return {};
  } finally {
    // don't disconnect here because caller may call again; leave client process-managed
  }
}
