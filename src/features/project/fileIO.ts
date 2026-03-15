import { createId } from '../../shared/id';
import { migrateLayoutProject } from '../../domain/schema/projectSchema';
import type { LayoutProject } from '../../domain/types';

type PickerWindow = Window & {
  showSaveFilePicker?: (options?: unknown) => Promise<unknown>;
};

export interface LoadedProjectFile {
  project: LayoutProject;
  fileName: string;
}

export const readTextFromFile = async (file: File): Promise<string> => file.text();

export const loadProjectFromFile = async (file: File): Promise<LoadedProjectFile> => {
  const text = await readTextFromFile(file);
  const parsed = JSON.parse(text) as unknown;
  return {
    project: migrateLayoutProject(parsed),
    fileName: file.name,
  };
};

export const readFileAsDataUrl = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

const triggerDownload = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const downloadTextFile = (text: string, fileName: string, mimeType: string): void => {
  triggerDownload(new Blob([text], { type: mimeType }), fileName);
};

export const downloadDataUrl = async (dataUrl: string, fileName: string): Promise<void> => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  triggerDownload(blob, fileName);
};

export const saveProjectDocument = async (
  text: string,
  fileName: string,
  _existingHandle: unknown,
): Promise<{ fileHandle: unknown | null; fileName: string }> => {
  const pickerWindow = window as PickerWindow;

  if (pickerWindow.showSaveFilePicker) {
    const handle = await pickerWindow.showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: 'Layout planner project',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
    });

    const writable = await (handle as { createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }> }).createWritable();
    await writable.write(text);
    await writable.close();
    return { fileHandle: handle, fileName: (handle as { name?: string }).name ?? fileName };
  }

  downloadTextFile(text, fileName, 'application/json');
  return { fileHandle: null, fileName };
};

export const createEmbeddedImageAsset = async (file: File) => ({
  id: createId('asset'),
  kind: 'image' as const,
  name: file.name,
  mimeType: file.type || 'image/png',
  dataUrl: await readFileAsDataUrl(file),
});
