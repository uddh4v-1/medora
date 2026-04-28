"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  type Visit,
  type VisitStatus,
} from "@/lib/dashboard-content";
import { useClinicStore, useHydrated } from "@/lib/store";

import { DashboardPageHeader } from "../_components/page-header";
import {
  AddToQueueDialog,
  type NewVisitInput,
} from "./_components/add-to-queue-dialog";
import { NowServingPanel } from "./_components/now-serving-panel";
import { QueueList } from "./_components/queue-list";
import { QueuePageSkeleton } from "./_components/queue-page-skeleton";
import { QueueStats } from "./_components/queue-stats";
import { WaitingPanel } from "./_components/waiting-panel";

type QueueFilter = "all" | VisitStatus;

const tabOrder: QueueFilter[] = [
  "all",
  "waiting",
  "in-progress",
  "completed",
];

const tabLabels: Record<QueueFilter, string> = {
  all: "All",
  waiting: "Waiting",
  "in-progress": "In progress",
  completed: "Completed",
};

const statusOrder: Record<VisitStatus, number> = {
  "in-progress": 0,
  waiting: 1,
  completed: 2,
};

function sortVisits(list: Visit[]) {
  return [...list].sort((a, b) => {
    const byStatus = statusOrder[a.status] - statusOrder[b.status];
    if (byStatus !== 0) return byStatus;
    return a.startedAt.localeCompare(b.startedAt);
  });
}

function nowIso() {
  return new Date().toISOString().slice(0, 19);
}

export default function QueuePage() {
  const hydrated = useHydrated();
  const visitsRaw = useClinicStore((s) => s.visits);
  const addVisit = useClinicStore((s) => s.addVisit);
  const setVisitStatus = useClinicStore((s) => s.setVisitStatus);

  const visits = useMemo(() => sortVisits(visitsRaw), [visitsRaw]);

  const counts = useMemo(
    () => ({
      waiting: visits.filter((v) => v.status === "waiting").length,
      "in-progress": visits.filter((v) => v.status === "in-progress").length,
      completed: visits.filter((v) => v.status === "completed").length,
    }),
    [visits],
  );

  const inProgressVisit = useMemo(
    () => visits.find((v) => v.status === "in-progress") ?? null,
    [visits],
  );

  const waitingQueue = useMemo(
    () =>
      visits
        .filter((v) => v.status === "waiting")
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
    [visits],
  );

  const nextVisit = waitingQueue[0] ?? null;

  function handleCreate(input: NewVisitInput) {
    addVisit({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v-${Date.now()}`,
      patient: input.patient,
      doctor: input.doctor,
      title: input.title,
      reason: input.reason || "Consultation",
      startedAt: nowIso(),
      status: "waiting",
    });
    toast.success("Added to queue", { description: input.patient });
  }

  if (!hydrated) {
    return <QueuePageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-5 px-6 py-6 md:px-8">
      <DashboardPageHeader
        eyebrow="Today's flow"
        title="Queue"
        actions={<AddToQueueDialog onCreate={handleCreate} />}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <NowServingPanel
          visit={inProgressVisit}
          nextVisit={nextVisit}
          onComplete={(id) => setVisitStatus(id, "completed")}
          onStartNext={(id) => setVisitStatus(id, "in-progress")}
          className="lg:col-span-2"
        />
        <WaitingPanel
          visits={waitingQueue.slice(0, 5)}
          canStart={!inProgressVisit}
          onStart={(id) => setVisitStatus(id, "in-progress")}
        />
      </section>

      <QueueStats
        waiting={counts.waiting}
        inProgress={counts["in-progress"]}
        completed={counts.completed}
      />

      <Tabs defaultValue="all" className="gap-4">
        <TabsList>
          {tabOrder.map((value) => {
            const count =
              value === "all" ? visits.length : counts[value];
            return (
              <TabsTrigger key={value} value={value}>
                {tabLabels[value]} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabOrder.map((value) => {
          const filtered =
            value === "all"
              ? visits
              : visits.filter((v) => v.status === value);
          return (
            <TabsContent key={value} value={value}>
              <QueueList
                visits={filtered}
                onAdvance={(id) => setVisitStatus(id, "in-progress")}
                onComplete={(id) => setVisitStatus(id, "completed")}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
