import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase.config';

export async function upload(path: string, file: File, metadata?: object) {
  const storageRef = ref(storage, `${path}/` + `${Date.now()}-${file.name}`);
  const uploadTaskSnap = await uploadBytesResumable(storageRef, file, metadata);
  const url = await getDownloadURL(uploadTaskSnap.ref);
  return url;
}
