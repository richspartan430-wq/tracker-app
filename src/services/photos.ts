import RNFS from 'react-native-fs';
import { Asset } from 'react-native-image-picker';
import { v4 as uuidv4 } from 'uuid';

const PHOTO_DIRECTORY = `${RNFS.DocumentDirectoryPath}/daily_discipline_photos`;

function extractExtension(asset: Asset): string {
  if (asset.fileName && asset.fileName.includes('.')) {
    return asset.fileName.split('.').pop() || 'jpg';
  }

  if (asset.type && asset.type.includes('/')) {
    return asset.type.split('/').pop() || 'jpg';
  }

  return 'jpg';
}

async function persistAsset(asset: Asset): Promise<string | null> {
  if (!asset.uri) {
    return null;
  }

  if (!asset.uri.startsWith('file://')) {
    return asset.uri;
  }

  await RNFS.mkdir(PHOTO_DIRECTORY);

  const extension = extractExtension(asset);
  const sourcePath = asset.uri.replace('file://', '');
  const targetPath = `${PHOTO_DIRECTORY}/${uuidv4()}.${extension}`;

  await RNFS.copyFile(sourcePath, targetPath);

  return `file://${targetPath}`;
}

export async function persistPickedPhotos(assets: Asset[]): Promise<string[]> {
  const values = await Promise.all(assets.map(asset => persistAsset(asset)));
  return values.filter((value): value is string => Boolean(value));
}
