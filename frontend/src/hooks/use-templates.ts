import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/store/settings";
import type { TopicTemplate } from "@/types/templates";
import {
  GetTemplates,
  SaveTemplate,
  UpdateTemplate,
  DeleteTemplate,
} from "@/lib/wails-client";

const TEMPLATE_KEYS = {
  all: (clusterId: string) => ["templates", clusterId] as const,
};

export function useTemplates(clusterIdOverride?: string) {
  const activeClusterId = useSettingsStore((s) => s.activeClusterId);
  const clusterId = clusterIdOverride ?? activeClusterId;
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: TEMPLATE_KEYS.all(clusterId ?? ""),
    queryFn: () => GetTemplates(clusterId ?? ""),
    enabled: !!clusterId,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey: TEMPLATE_KEYS.all(clusterId!),
    });
  };

  const saveMutation = useMutation({
    mutationFn: (tmpl: TopicTemplate) => SaveTemplate(clusterId!, tmpl),
    onSuccess: invalidateAll,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, tmpl }: { id: string; tmpl: TopicTemplate }) =>
      UpdateTemplate(clusterId!, id, tmpl),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DeleteTemplate(clusterId!, id),
    onSuccess: invalidateAll,
  });

  // Convert map to array for easier UI consumption
  const templateMap = templatesQuery.data ?? {};
  const templateList = Object.values(templateMap);

  return {
    templates: templateMap,
    templateList,
    isLoading: templatesQuery.isLoading,
    save: saveMutation,
    update: updateMutation,
    delete: deleteMutation,
    invalidate: invalidateAll,
  };
}
