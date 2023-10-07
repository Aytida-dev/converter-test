
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { toast } from 'sonner';

 export default async function loadFfmpeg(): Promise<FFmpeg> {
  const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.2/dist/esm";
  const ffmpeg = new FFmpeg()

  
  await ffmpeg.load({
    coreURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      "text/javascript"
    ),
    wasmURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      "application/wasm"
    ),
    workerURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.worker.js`,
      "text/javascript"
    ),
  });
  
  toast.success("Ready to convert files");

  return ffmpeg;

};


