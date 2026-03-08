/**
 * Annotation Domain Types
 *
 * Re-exports Wails-generated model classes as the canonical types.
 */

import { annotations } from "../../wailsjs/go/models";

export type TopicAnnotation = annotations.TopicAnnotation;

/** Flattened view for UI display */
export interface TopicWithAnnotation {
  topicName: string;
  producers: string[];
  consumers: string[];
  notes: string;
}
