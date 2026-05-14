import { beforeAll, describe, expect, it } from "vitest";

import { createClient } from "@/features/clients/actions";
import { createService } from "@/features/services/actions";
import {
  createServiceTask,
  deleteServiceTask,
  reorderServiceTasks,
} from "@/features/service-tasks/actions";
import { createWorkLog } from "@/features/work-logs/actions";
import { prisma } from "@/server/db/client";

describe.skipIf(process.env.RUN_DB_TESTS !== "1")(
  "service task delete (DB tests require RUN_DB_TESTS=1)",
  { timeout: 15000 },
  () => {
    let tenantId: string;

    beforeAll(async () => {
      const tenant = await prisma.tenant.findUniqueOrThrow({
        where: { slug: "demo-obraflow" },
      });
      tenantId = tenant.id;
    });

    it("deletes a task when tenantId + serviceId + taskId all match", async () => {
      const suffix = `delete-ok-${Date.now()}`;
      const client = await createClient(tenantId, {
        name: `Client ${suffix}`,
        kind: "PERSON",
      });
      const service = await createService(tenantId, {
        clientId: client.id,
        title: `Service ${suffix}`,
        type: "FIRE_SAFETY",
      });
      const task = await createServiceTask(tenantId, {
        serviceId: service.id,
        title: `Task ${suffix}`,
      });

      const deleted = await deleteServiceTask(tenantId, service.id, task.id);

      expect(deleted.id).toBe(task.id);

      const remaining = await prisma.serviceTask.findUnique({
        where: { id: task.id },
      });
      expect(remaining).toBeNull();
    });

    it("does not delete a task that belongs to a different service", async () => {
      const suffix = `delete-wrong-svc-${Date.now()}`;
      const client = await createClient(tenantId, {
        name: `Client ${suffix}`,
        kind: "PERSON",
      });
      const serviceA = await createService(tenantId, {
        clientId: client.id,
        title: `Service A ${suffix}`,
        type: "FIRE_SAFETY",
      });
      const serviceB = await createService(tenantId, {
        clientId: client.id,
        title: `Service B ${suffix}`,
        type: "FIRE_SAFETY",
      });
      const task = await createServiceTask(tenantId, {
        serviceId: serviceA.id,
        title: `Task ${suffix}`,
      });

      await expect(
        deleteServiceTask(tenantId, serviceB.id, task.id),
      ).rejects.toThrow(/does not belong to service/);
    });

    it("propagates error when task does not exist", async () => {
      const suffix = `delete-missing-${Date.now()}`;
      const client = await createClient(tenantId, {
        name: `Client ${suffix}`,
        kind: "PERSON",
      });
      const service = await createService(tenantId, {
        clientId: client.id,
        title: `Service ${suffix}`,
        type: "FIRE_SAFETY",
      });

      await expect(
        deleteServiceTask(tenantId, service.id, "non-existent-task-id"),
      ).rejects.toThrow(/does not belong to service/);
    });

    it("throws friendly message when task has work logs (P2003 FK restrict)", async () => {
      const suffix = `delete-fk-${Date.now()}`;
      const client = await createClient(tenantId, {
        name: `Client ${suffix}`,
        kind: "PERSON",
      });
      const service = await createService(tenantId, {
        clientId: client.id,
        title: `Service ${suffix}`,
        type: "FIRE_SAFETY",
      });
      const task = await createServiceTask(tenantId, {
        serviceId: service.id,
        title: `Task ${suffix}`,
      });

      await createWorkLog(tenantId, {
        serviceId: service.id,
        taskId: task.id,
        summary: "Trabalho realizado",
        performedAt: "2025-06-15T08:00",
      });

      await expect(
        deleteServiceTask(tenantId, service.id, task.id),
      ).rejects.toThrow(/registros de trabalho/);
    });

    it("does not cascade delete work logs", async () => {
      const suffix = `no-cascade-${Date.now()}`;
      const client = await createClient(tenantId, {
        name: `Client ${suffix}`,
        kind: "PERSON",
      });
      const service = await createService(tenantId, {
        clientId: client.id,
        title: `Service ${suffix}`,
        type: "FIRE_SAFETY",
      });
      const task = await createServiceTask(tenantId, {
        serviceId: service.id,
        title: `Task ${suffix}`,
      });

      await createWorkLog(tenantId, {
        serviceId: service.id,
        taskId: task.id,
        summary: "Trabalho que deve sobreviver",
        performedAt: "2025-06-15T08:00",
      });

      try {
        await deleteServiceTask(tenantId, service.id, task.id);
      } catch {
        // Expected to fail
      }

      const workLogs = await prisma.workLog.findMany({
        where: { tenantId, serviceId: service.id, taskId: task.id },
      });
      expect(workLogs.length).toBe(1);
    });

    it("reorders tasks and persists sortOrder", async () => {
      const suffix = `reorder-${Date.now()}`;
      const client = await createClient(tenantId, {
        name: `Client ${suffix}`,
        kind: "PERSON",
      });
      const service = await createService(tenantId, {
        clientId: client.id,
        title: `Service ${suffix}`,
        type: "FIRE_SAFETY",
      });
      const taskA = await createServiceTask(tenantId, {
        serviceId: service.id,
        title: `Task A ${suffix}`,
      });
      const taskB = await createServiceTask(tenantId, {
        serviceId: service.id,
        title: `Task B ${suffix}`,
      });
      const taskC = await createServiceTask(tenantId, {
        serviceId: service.id,
        title: `Task C ${suffix}`,
      });

      await reorderServiceTasks(tenantId, service.id, [
        taskC.id,
        taskA.id,
        taskB.id,
      ]);

      const tasks = await prisma.serviceTask.findMany({
        where: { tenantId, serviceId: service.id },
        orderBy: { sortOrder: "asc" },
      });

      expect(tasks.map((t) => t.id)).toEqual([taskC.id, taskA.id, taskB.id]);
      expect(tasks[0].sortOrder).toBe(0);
      expect(tasks[1].sortOrder).toBe(1);
      expect(tasks[2].sortOrder).toBe(2);
    });

    it("does not reorder tasks from another service", async () => {
      const suffix = `reorder-wrong-${Date.now()}`;
      const client = await createClient(tenantId, {
        name: `Client ${suffix}`,
        kind: "PERSON",
      });
      const serviceA = await createService(tenantId, {
        clientId: client.id,
        title: `Service A ${suffix}`,
        type: "FIRE_SAFETY",
      });
      const serviceB = await createService(tenantId, {
        clientId: client.id,
        title: `Service B ${suffix}`,
        type: "FIRE_SAFETY",
      });
      const taskA = await createServiceTask(tenantId, {
        serviceId: serviceA.id,
        title: `Task A ${suffix}`,
      });
      const taskB = await createServiceTask(tenantId, {
        serviceId: serviceB.id,
        title: `Task B ${suffix}`,
      });

      await expect(
        reorderServiceTasks(tenantId, serviceA.id, [taskA.id, taskB.id]),
      ).rejects.toThrow(/Expected 1 tasks, got 2/);
    });

    it("rejects when task list contains duplicate IDs", async () => {
      const suffix = `reorder-dup-${Date.now()}`;
      const client = await createClient(tenantId, {
        name: `Client ${suffix}`,
        kind: "PERSON",
      });
      const service = await createService(tenantId, {
        clientId: client.id,
        title: `Service ${suffix}`,
        type: "FIRE_SAFETY",
      });
      const taskA = await createServiceTask(tenantId, {
        serviceId: service.id,
        title: `Task A ${suffix}`,
      });
      const taskB = await createServiceTask(tenantId, {
        serviceId: service.id,
        title: `Task B ${suffix}`,
      });

      await expect(
        reorderServiceTasks(tenantId, service.id, [
          taskA.id,
          taskA.id,
          taskB.id,
        ]),
      ).rejects.toThrow(/Duplicate task IDs/);

      const tasks = await prisma.serviceTask.findMany({
        where: { tenantId, serviceId: service.id },
        orderBy: { sortOrder: "asc" },
      });

      expect(tasks[0].sortOrder).toBe(0);
      expect(tasks[1].sortOrder).toBe(1);
    });
  },
);