import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/store/settings";
import type { TopicAnnotation } from "@/types/annotations";
import {
  GetAnnotations,
  SetAnnotation,
  BatchSetAnnotation,
  DeleteAnnotation,
  GetServiceNames,
} from "@/lib/wails-client";

const ANNOTATION_KEYS = {
  all: (clusterId: string) => ["annotations", clusterId] as const,
  topic: (clusterId: string, topic: string) =>
    ["annotations", clusterId, topic] as const,
  serviceNames: (clusterId: string) =>
    ["annotation-service-names", clusterId] as const,
};

export function useAnnotations() {
  const clusterId = useSettingsStore((s) => s.activeClusterId);
  const queryClient = useQueryClient();

  const annotationsQuery = useQuery({
    queryKey: ANNOTATION_KEYS.all(clusterId ?? ""),
    queryFn: () => GetAnnotations(clusterId ?? ""),
    enabled: !!clusterId,
  });

  const serviceNamesQuery = useQuery({
    queryKey: ANNOTATION_KEYS.serviceNames(clusterId ?? ""),
    queryFn: () => GetServiceNames(clusterId ?? ""),
    enabled: !!clusterId,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey: ANNOTATION_KEYS.all(clusterId!),
    });
    queryClient.invalidateQueries({
      queryKey: ANNOTATION_KEYS.serviceNames(clusterId!),
    });
  };

  const setAnnotationMutation = useMutation({
    mutationFn: ({
      topicName,
      annotation,
    }: {
      topicName: string;
      annotation: TopicAnnotation;
    }) => SetAnnotation(clusterId!, topicName, annotation),
    onSuccess: invalidateAll,
  });

  const batchSetAnnotationMutation = useMutation({
    mutationFn: ({
      topicNames,
      annotation,
    }: {
      topicNames: string[];
      annotation: TopicAnnotation;
    }) => BatchSetAnnotation(clusterId!, topicNames, annotation),
    onSuccess: invalidateAll,
  });

  const deleteAnnotationMutation = useMutation({
    mutationFn: (topicName: string) => DeleteAnnotation(clusterId!, topicName),
    onSuccess: invalidateAll,
  });

  return {
    annotations: annotationsQuery.data ?? {},
    serviceNames: serviceNamesQuery.data ?? [],
    isLoading: annotationsQuery.isLoading,
    setAnnotation: setAnnotationMutation,
    batchSetAnnotation: batchSetAnnotationMutation,
    deleteAnnotation: deleteAnnotationMutation,
    invalidate: invalidateAll,
  };
}
