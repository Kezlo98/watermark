import { useState } from "react";
import { TabNavigation } from "@/components/shared/tab-navigation";
import { MessagesTab } from "./messages-tab";
import { ConsumersTab } from "./consumers-tab";
import { PartitionsTab } from "./partitions-tab";
import { ConfigurationTab } from "./configuration-tab";
import { AclsTab } from "./acls-tab";

const TABS = [
  { id: "messages", label: "Messages" },
  { id: "consumers", label: "Consumers" },
  { id: "partitions", label: "Partitions" },
  { id: "configuration", label: "Configuration" },
  { id: "acls", label: "ACLs" },
];

interface TopicTabsProps {
  topicName: string;
}

export function TopicTabs({ topicName }: TopicTabsProps) {
  const [activeTab, setActiveTab] = useState("messages");

  return (
    <div>
      <TabNavigation
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="horizontal"
      />
      <div className="mt-6">
        {activeTab === "messages" && <MessagesTab topicName={topicName} />}
        {activeTab === "consumers" && <ConsumersTab topicName={topicName} />}
        {activeTab === "partitions" && <PartitionsTab topicName={topicName} />}
        {activeTab === "configuration" && <ConfigurationTab topicName={topicName} />}
        {activeTab === "acls" && <AclsTab topicName={topicName} />}
      </div>
    </div>
  );
}
