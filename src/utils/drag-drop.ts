/**
 * Drag & Drop utilities for the agenda builder.
 * Uses native HTML5 DnD API.
 */

import type { DragPayload } from '../types';

const MIME = 'application/x-tempo-drag';

/** Set drag data on a drag event */
export function setDragData(e: DragEvent, payload: DragPayload): void {
  e.dataTransfer?.setData(MIME, JSON.stringify(payload));
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
  }
}

/** Read drag data from a drag/drop event */
export function getDragData(e: DragEvent): DragPayload | null {
  const raw = e.dataTransfer?.getData(MIME);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
}

/** Check if this drag event carries Tempo drag data */
export function hasDragData(e: DragEvent): boolean {
  return e.dataTransfer?.types.includes(MIME) ?? false;
}

/** Make an element a drop target with visual feedback */
export function makeDropTarget(
  el: HTMLElement,
  onDrop: (payload: DragPayload, e: DragEvent) => void,
): () => void {
  function handleDragOver(e: DragEvent) {
    if (hasDragData(e)) {
      e.preventDefault();
      el.classList.add('drag-over');
    }
  }
  function handleDragLeave() {
    el.classList.remove('drag-over');
  }
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    el.classList.remove('drag-over');
    const data = getDragData(e);
    if (data) onDrop(data, e);
  }

  el.addEventListener('dragover', handleDragOver);
  el.addEventListener('dragleave', handleDragLeave);
  el.addEventListener('drop', handleDrop);

  return () => {
    el.removeEventListener('dragover', handleDragOver);
    el.removeEventListener('dragleave', handleDragLeave);
    el.removeEventListener('drop', handleDrop);
  };
}
