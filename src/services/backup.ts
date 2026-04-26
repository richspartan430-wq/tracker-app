import RNFS from 'react-native-fs';
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';
import { z } from 'zod';
import { AppBackup, AppSettings, DailyEntry } from '../types/domain';

export const BACKUP_SCHEMA_VERSION = 1;

const yesNoSchema = z.union([z.literal('yes'), z.literal('no'), z.null()]);

const dailyEntrySchema = z.object({
  date: z.string(),
  wakeTime: z.string().optional(),
  sleepTime: z.string().optional(),
  plannedCalories: z.number().optional(),
  trackedCalories: z.number().optional(),
  steps: z.number().optional(),
  builtInHabits: z.object({
    trataka: yesNoSchema,
    brushedTeeth: yesNoSchema,
    washedFace: yesNoSchema,
    discipline: yesNoSchema,
  }),
  customHabits: z.record(z.string(), yesNoSchema),
  exercises: z.record(
    z.string(),
    z.object({
      sets: z.number().optional(),
      reps: z.number().optional(),
    }),
  ),
  notes: z.string().optional(),
  photoUris: z.array(z.string()),
  updatedAt: z.number(),
});

const settingsSchema = z.object({
  themeMode: z.union([z.literal('system'), z.literal('light'), z.literal('dark')]),
  builtInHabitVisibility: z.object({
    trataka: z.boolean(),
    brushedTeeth: z.boolean(),
    washedFace: z.boolean(),
    discipline: z.boolean(),
  }),
  disciplineQuestionLabel: z.string(),
  customQuestions: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      enabled: z.boolean(),
      builtIn: z.boolean().optional(),
    }),
  ),
});

const backupSchema = z.object({
  schemaVersion: z.number(),
  exportedAt: z.string(),
  settings: settingsSchema,
  entries: z.array(dailyEntrySchema),
});

function normalizeUriToPath(rawUri: string): string {
  if (rawUri.startsWith('file://')) {
    return rawUri.replace('file://', '');
  }

  return rawUri;
}

export async function exportBackupFile(
  settings: AppSettings,
  entries: DailyEntry[],
): Promise<string> {
  const payload: AppBackup = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    entries,
  };

  const targetDirectory =
    RNFS.DownloadDirectoryPath || RNFS.DocumentDirectoryPath;
  const fileName = `daily_discipline_backup_${Date.now()}.json`;
  const absolutePath = `${targetDirectory}/${fileName}`;

  await RNFS.writeFile(absolutePath, JSON.stringify(payload, null, 2), 'utf8');

  return absolutePath;
}

export async function importBackupFile(): Promise<AppBackup> {
  const files = await pick({
    type: [types.allFiles],
    allowMultiSelection: false,
    mode: 'open',
  });

  const selectedFile = files[0];
  const fileName = selectedFile.name || `daily_discipline_import_${Date.now()}.json`;

  const copied = await keepLocalCopy({
    destination: 'cachesDirectory',
    files: [
      {
        uri: selectedFile.uri,
        fileName,
      },
    ],
  });

  const copyResult = copied[0];
  if (copyResult.status !== 'success') {
    throw new Error(copyResult.copyError || 'Could not copy backup file locally.');
  }

  const sourceUri = copyResult.localUri;
  const filePath = normalizeUriToPath(sourceUri);
  const fileContent = await RNFS.readFile(filePath, 'utf8');
  const parsed = backupSchema.parse(JSON.parse(fileContent));

  if (parsed.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported backup schema version: ${parsed.schemaVersion}. Expected ${BACKUP_SCHEMA_VERSION}.`,
    );
  }

  return parsed;
}

export function isImportCancelled(error: unknown): boolean {
  return isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED;
}
