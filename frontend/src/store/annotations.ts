import { create } from "zustand";

interface AnnotationUIState {
  /* Batch tagging */
  selectedTopicsForTag: string[];
  setSelectedTopicsForTag: (topics: string[]) => void;
  toggleTopicForTag: (topic: string) => void;
  clearSelectedTopics: () => void;

  /* Editor modal */
  editingTopic: string | null;
  openEditor: (topicName: string) => void;
  closeEditor: () => void;

  /* Batch modal */
  isBatchModalOpen: boolean;
  openBatchModal: () => void;
  closeBatchModal: () => void;
}

export const useAnnotationUIStore = create<AnnotationUIState>((set) => ({
  selectedTopicsForTag: [],
  setSelectedTopicsForTag: (topics) => set({ selectedTopicsForTag: topics }),
  toggleTopicForTag: (topic) =>
    set((s) => ({
      selectedTopicsForTag: s.selectedTopicsForTag.includes(topic)
        ? s.selectedTopicsForTag.filter((t) => t !== topic)
        : [...s.selectedTopicsForTag, topic],
    })),
  clearSelectedTopics: () => set({ selectedTopicsForTag: [] }),

  editingTopic: null,
  openEditor: (topicName) => set({ editingTopic: topicName }),
  closeEditor: () => set({ editingTopic: null }),

  isBatchModalOpen: false,
  openBatchModal: () => set({ isBatchModalOpen: true }),
  closeBatchModal: () => set({ isBatchModalOpen: false, selectedTopicsForTag: [] }),
}));
