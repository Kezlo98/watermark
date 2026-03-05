import { useState } from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { Plus, Send } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { SettingsOverlay } from "@/components/settings/settings-overlay";

/* ====== Dashboard imports ====== */
import { DashboardMetricCards } from "@/components/dashboard/metric-cards";
import { BrokerTable } from "@/components/dashboard/broker-table";

/* ====== Topics imports ====== */
import { TopicListTable } from "@/components/topics/topic-list-table";
import { CreateTopicModal } from "@/components/topics/create-topic-modal";
import { TopicTabs } from "@/components/topics/topic-tabs";
import { ProduceMessageModal } from "@/components/topics/produce-message-modal";
import { SearchInput } from "@/components/shared/search-input";

/* ====== Consumers imports ====== */
import { ConsumerGroupTable } from "@/components/consumers/consumer-group-table";
import { GroupDetailHeader } from "@/components/consumers/group-detail-header";
import { ActiveMembersTable } from "@/components/consumers/active-members-table";
import { OffsetsLagTable } from "@/components/consumers/offsets-lag-table";

/* ====== Schemas imports ====== */
import { SubjectList } from "@/components/schemas/subject-list";
import { SchemaViewer } from "@/components/schemas/schema-viewer";
import { VersionHistory } from "@/components/schemas/version-history";

/* ========================================================================= */
/*  Root layout — App Shell                                                  */
/* ========================================================================= */
const rootRoute = createRootRoute({
  component: () => (
    <div className="flex h-screen bg-background text-foreground dark">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1280px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <SettingsOverlay />
    </div>
  ),
});

/* ========================================================================= */
/*  Phase 02 — Dashboard                                                     */
/* ========================================================================= */
function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-mono font-bold uppercase tracking-wider">
        Cluster Overview
      </h1>
      <DashboardMetricCards />
      <BrokerTable />
    </div>
  );
}

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

/* ========================================================================= */
/*  Phase 03 — Topics Index                                                  */
/* ========================================================================= */
function TopicsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [hideInternal, setHideInternal] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mono font-bold uppercase tracking-wider">
          Topics
        </h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
        >
          <Plus className="size-3.5" />
          Create Topic
        </button>
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search topics..."
          className="w-80"
        />
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={hideInternal}
            onChange={(e) => setHideInternal(e.target.checked)}
            className="size-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50"
          />
          Hide Internal Topics
        </label>
      </div>

      <TopicListTable
        onTopicClick={(name) => navigate({ to: "/topics/$topicId", params: { topicId: name } })}
        searchFilter={search}
        hideInternal={hideInternal}
      />

      <CreateTopicModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

const topicsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/topics",
  component: TopicsPage,
});

/* ========================================================================= */
/*  Phase 03 — Topic Detail                                                  */
/* ========================================================================= */
function TopicDetailPage() {
  const { topicId } = useParams({ from: "/topics/$topicId" });
  const [produceOpen, setProduceOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mono font-bold uppercase tracking-wider">
          Topic: <span className="text-primary">{topicId}</span>
        </h1>
        <button
          onClick={() => setProduceOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
        >
          <Send className="size-3.5" />
          Produce Message
        </button>
      </div>

      <TopicTabs topicName={topicId} />

      <ProduceMessageModal
        isOpen={produceOpen}
        onClose={() => setProduceOpen(false)}
        topicName={topicId}
      />
    </div>
  );
}

const topicDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/topics/$topicId",
  component: TopicDetailPage,
});

/* ========================================================================= */
/*  Phase 04 — Consumer Groups Index                                         */
/* ========================================================================= */
function ConsumersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-mono font-bold uppercase tracking-wider">
        Consumer Groups
      </h1>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search consumer groups..."
        className="w-80"
      />
      <ConsumerGroupTable
        onGroupClick={(id) =>
          navigate({ to: "/consumers/$groupId", params: { groupId: id } })
        }
        searchFilter={search}
      />
    </div>
  );
}

const consumersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/consumers",
  component: ConsumersPage,
});

/* ========================================================================= */
/*  Phase 04 — Consumer Group Detail                                         */
/* ========================================================================= */
function ConsumerDetailPage() {
  const { groupId } = useParams({ from: "/consumers/$groupId" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mono font-bold uppercase tracking-wider">
          Consumer Group: <span className="text-primary">{groupId}</span>
        </h1>
        <div className="flex gap-2">
          <button
            disabled
            className="px-4 py-2 text-sm text-slate-400 bg-white/5 rounded-lg border border-white/10 opacity-50 cursor-not-allowed"
            title="Group must be Empty or Dead to reset offsets"
          >
            ⏪ Reset Offsets
          </button>
          <button className="px-4 py-2 text-sm text-semantic-red bg-semantic-red/10 rounded-lg border border-semantic-red/20 hover:bg-semantic-red/20 transition-colors">
            🗑️ Drop Group
          </button>
        </div>
      </div>

      <GroupDetailHeader
        groupId={groupId}
        state="Stable"
        coordinator={1}
        totalLag={1402}
      />

      <div className="space-y-6">
        <OffsetsLagTable />
        <ActiveMembersTable />
      </div>
    </div>
  );
}

const consumerDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/consumers/$groupId",
  component: ConsumerDetailPage,
});

/* ========================================================================= */
/*  Phase 06 — Schema Registry                                               */
/* ========================================================================= */
function SchemasPage() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>("user.signup");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-mono font-bold uppercase tracking-wider">
        Schema Registry
      </h1>

      <div className="grid grid-cols-[280px_1fr] gap-4 h-[calc(100vh-240px)]">
        <div className="glass-panel overflow-hidden">
          <SubjectList
            selectedSubject={selectedSubject}
            onSelect={setSelectedSubject}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="glass-panel flex-1 overflow-hidden">
            {selectedSubject ? (
              <SchemaViewer subjectName={selectedSubject} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Select a subject to view its schema
              </div>
            )}
          </div>

          {selectedSubject && (
            <VersionHistory subjectName={selectedSubject} />
          )}
        </div>
      </div>
    </div>
  );
}

const schemasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/schemas",
  component: SchemasPage,
});

/* ========================================================================= */
/*  Router tree                                                               */
/* ========================================================================= */
const routeTree = rootRoute.addChildren([
  dashboardRoute,
  topicsRoute,
  topicDetailRoute,
  consumersRoute,
  consumerDetailRoute,
  schemasRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
