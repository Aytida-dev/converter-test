import { useEffect, useRef, useState } from "react";
import Dropzone from "react-dropzone";
import {
  FiUploadCloud,
  FiImage,
  FiMusic,
  FiVideo,
  FiFile,
} from "react-icons/fi";
import { LuFileSymlink } from "react-icons/lu";
import { HiOutlineDownload } from "react-icons/hi";
import { BiError } from "react-icons/bi";
import { MdDone, MdClose } from "react-icons/md";
import { ImSpinner3 } from "react-icons/im";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import convert from "../utils/convertFile";
import loadFfmpeg from "../utils/loadFfmpeg";
import { accepted_files, extensions } from "@/utils/typesAndFileTypes";
import type { Action } from "../utils/typesAndFileTypes";
import { toast } from "sonner";

export default function ConverterArea() {
  const [is_hover, setIsHover] = useState<boolean>(false);
  const [actions, setActions] = useState<Array<Action>>([]);
  const [is_converting, setIsConverting] = useState<boolean>(false);
  const [is_done, setIsDone] = useState<boolean>(false);
  const [is_ready, setIsReady] = useState<boolean>(false);
  const [err, setErr] = useState<boolean>(false);
  const ffmpegRef = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const ffmpeg = await loadFfmpeg();
        ffmpegRef.current = ffmpeg;
      } catch (error) {
        console.error("Error loading FFmpeg:", error);
        setErr(true);
        toast.error("Failed to load FFmpeg");
      }
    };

    load();
  }, []);

  useEffect(() => {
    function checkIsReady() {
      const tempIsReady = actions.every((action) => action.convert_to !== "");

      setIsReady(tempIsReady);
    }

    if (!actions.length) {
      setIsDone(false);
      setIsReady(false);
      setIsConverting(false);
    } else checkIsReady();
  }, [actions]);

  function handleUpload(acceptedFiles: Array<any>): void {
    try {
      const tmp: Array<Action> = [];
      acceptedFiles.forEach((file: any) => {
        tmp.push({
          file,
          is_converting: false,
          is_converted: false,
          is_error: false,
          converted_file_name: "",
          convert_to: "",
        });
      });
      setActions(tmp);
      setIsHover(false);
      toast.success("File(s) uploaded");
    } catch (error) {
      console.log(error);
      toast.error("Error while uploading file(s)");
    }
  }

  const convertFile = async (): Promise<any> => {
    let tmp_actions: Array<Action> = actions.map((action) => ({
      ...action,
      is_converting: true,
    }));
    setActions(tmp_actions);
    setIsConverting(true);
    for (let action of tmp_actions) {
      try {
        const { url, output } = await convert(ffmpegRef.current, action);
        tmp_actions = tmp_actions.map((elt) =>
          elt === action
            ? {
                ...elt,
                is_converted: true,
                is_converting: false,
                url,
                output,
              }
            : elt
        );
        setActions(tmp_actions);
      } catch (err: any) {
        console.log(err);
        tmp_actions = tmp_actions.map((elt) =>
          elt === action
            ? {
                ...elt,
                is_converted: false,
                is_converting: false,
                is_error: true,
              }
            : elt
        );
        setActions(tmp_actions);
        toast.error(`${action.file.name} could not be converted`, {
          description: "see console for more details",
        });
      }
    }
    setIsDone(true);
    setIsConverting(false);
  };

  function handleHover(): void {
    setIsHover(true);
  }

  function handleExitHover(): void {
    setIsHover(false);
  }

  const updateAction = (file_name: string, convert_to: string) => {
    const actionIndex = actions.findIndex(
      (action) => action.file.name === file_name
    );

    if (actionIndex !== -1) {
      const updatedActions = [...actions];

      updatedActions[actionIndex] = {
        ...updatedActions[actionIndex],
        convert_to,
      };

      setActions(updatedActions);
    }
  };

  const downloadAll = (): void => {
    for (let action of actions) {
      !action.is_error && download(action);
    }
  };
  const download = (action: Action) => {
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = action.url;
    a.download = action.output;

    document.body.appendChild(a);
    a.click();

    // Clean up after download
    URL.revokeObjectURL(action.url);
    document.body.removeChild(a);
    toast.success(`Downloading ${action.file.name}`);
  };

  function deleteAction(action: Action) {
    const tmp = actions.filter((elt) => elt.file.name !== action.file.name);
    setActions(tmp);
  }

  function reset() {
    setActions([]);
    setIsHover(false);
    setIsConverting(false);
    setIsDone(false);
    toast.success("Ready to convert more files");
  }
  const fileToIcon = (extension: string) => {
    const lowercaseExtension = extension.toLowerCase();
    const desiredExtension = lowercaseExtension.split("/")[1];

    const fileLookup: Record<string, JSX.Element> = {
      jpg: <FiImage />,
      jpeg: <FiImage />,
      png: <FiImage />,
      gif: <FiImage />,
      mp3: <FiMusic />,
      wav: <FiMusic />,
      mpeg: <FiMusic />,
      mp4: <FiVideo />,
      avi: <FiVideo />,
      mkv: <FiVideo />,
    };

    return fileLookup[desiredExtension] || <FiFile />;
  };

  function compressFileName(fileName: any): string {
    const maxSubstrLength = 18;

    if (fileName.length > maxSubstrLength) {
      const fileNameWithoutExtension = fileName
        .split(".")
        .slice(0, -1)
        .join(".");

      const fileExtension = fileName.split(".").pop();

      const charsToKeep =
        maxSubstrLength -
        (fileNameWithoutExtension.length + fileExtension.length + 3);

      const compressedFileName =
        fileNameWithoutExtension.substring(
          0,
          maxSubstrLength - fileExtension.length - 3
        ) +
        "..." +
        fileNameWithoutExtension.slice(-charsToKeep) +
        "." +
        fileExtension;

      return compressedFileName;
    } else {
      return fileName.trim();
    }
  }

  function bytesToSize(bytes: number): String {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    if (bytes === 0) return "0 Byte";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(2);

    return `${size} ${sizes[i]}`;
  }

  if (err) {
    return (
      <div className="bg-gray-50 h-72 lg:h-80 xl:h-96 rounded-3xl shadow-sm border-2 border-dashed cursor-pointer flex items-center justify-center text-center font-medium text-2xl text-red-500">
        <span>
          Oops! something unexpected happended , Try refreshing the page
        </span>
      </div>
    );
  }

  return (
    <div>
      {actions.length === 0 ? (
        <Dropzone
          onDrop={handleUpload}
          onDragEnter={handleHover}
          onDragLeave={handleExitHover}
          accept={accepted_files}
          onDropRejected={() => {
            handleExitHover();
            toast.error("File type not supported");
          }}
          onError={() => {
            handleExitHover();
            toast.error("File type not supported");
          }}
        >
          {({ getRootProps, getInputProps }) => (
            <div
              {...getRootProps()}
              className="bg-gray-50 h-72 lg:h-80 xl:h-96 rounded-3xl shadow-sm border-2 border-dashed cursor-pointer flex items-center justify-center"
            >
              <input {...getInputProps()} />
              <div className="space-y-4 text-gray-500">
                {is_hover ? (
                  <>
                    <div className="justify-center flex text-6xl">
                      <LuFileSymlink />
                    </div>
                    <h3 className="text-center font-medium text-2xl">
                      Yes, right there
                    </h3>
                  </>
                ) : (
                  <>
                    <div className="justify-center flex text-6xl">
                      <FiUploadCloud />
                    </div>
                    <h3 className="text-center font-medium text-2xl">
                      Click, or drop your files here{" "}
                      <span className="text-sm">(max:10 MB)</span>
                    </h3>
                  </>
                )}
              </div>
            </div>
          )}
        </Dropzone>
      ) : (
        <div className="space-y-6">
          {actions.map((action: Action, i: any) => (
            <div
              key={i}
              className="w-full py-4 space-y-2 lg:py-0 relative cursor-pointer rounded-xl border h-fit lg:h-20 px-4 lg:px-10 flex flex-wrap lg:flex-nowrap items-center justify-between"
            >
              <div className="flex gap-4 items-center">
                <span className="text-2xl text-orange-600">
                  {fileToIcon(action.file.type)}
                </span>
                <div className="flex items-center gap-1 w-96">
                  <span className="text-md font-medium overflow-x-hidden">
                    {compressFileName(action.file.name)}
                  </span>
                  <span className="text-gray-400 text-sm">
                    ({bytesToSize(action.file.size)})
                  </span>
                </div>
              </div>

              {action.is_error ? (
                <Badge variant="destructive" className="flex gap-2">
                  <span>Error Converting File</span>
                  <BiError />
                </Badge>
              ) : action.is_converted ? (
                <Badge variant="default" className="flex gap-2 bg-green-500">
                  <span>Done</span>
                  <MdDone />
                </Badge>
              ) : action.is_converting ? (
                <Badge variant="default" className="flex gap-2">
                  <span>Converting</span>
                  <span className="animate-spin">
                    <ImSpinner3 />
                  </span>
                </Badge>
              ) : (
                <div className="text-gray-400 text-md flex items-center gap-4">
                  <span>Convert to</span>
                  <Select
                    onValueChange={(value: string) =>
                      updateAction(action.file.name, value)
                    }
                  >
                    <SelectTrigger className="w-32 outline-none focus:outline-none focus:ring-0 text-center text-gray-600 bg-gray-50 text-md font-medium">
                      <SelectValue placeholder="..." />
                    </SelectTrigger>
                    <SelectContent className="h-fit">
                      {action.file.type.includes("image") && (
                        <div className="grid grid-cols-2 gap-2 w-fit">
                          {extensions.image.map((elt, i) => (
                            <div key={i} className="col-span-1 text-center">
                              <SelectItem value={elt} className="mx-auto">
                                {elt}
                              </SelectItem>
                            </div>
                          ))}
                        </div>
                      )}
                      {action.file.type.includes("video") && (
                        <Tabs className="w-full">
                          <TabsList className="w-full">
                            <TabsTrigger value="video" className="w-full">
                              Video
                            </TabsTrigger>
                            <TabsTrigger value="audio" className="w-full">
                              Audio
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="video">
                            <div className="grid grid-cols-3 gap-2 w-fit">
                              {extensions.video.map((elt, i) => (
                                <div key={i} className="col-span-1 text-center">
                                  <SelectItem value={elt} className="mx-auto">
                                    {elt}
                                  </SelectItem>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                          <TabsContent value="audio">
                            <div className="grid grid-cols-3 gap-2 w-fit">
                              {extensions.audio.map((elt, i) => (
                                <div key={i} className="col-span-1 text-center">
                                  <SelectItem value={elt} className="mx-auto">
                                    {elt}
                                  </SelectItem>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}
                      {action.file.type.includes("audio") && (
                        <div className="grid grid-cols-2 gap-2 w-fit">
                          {extensions.audio.map((elt, i) => (
                            <div key={i} className="col-span-1 text-center">
                              <SelectItem value={elt} className="mx-auto">
                                {elt}
                              </SelectItem>
                            </div>
                          ))}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {action.is_converted ? (
                <Button
                  variant="outline"
                  onClick={() => download(action)}
                  disabled={action.is_error}
                >
                  Download
                </Button>
              ) : (
                <span
                  onClick={() => deleteAction(action)}
                  className="cursor-pointer hover:bg-gray-50 rounded-full h-10 w-10 flex items-center justify-center text-2xl text-gray-400"
                >
                  <MdClose />
                </span>
              )}
            </div>
          ))}
          <div className="flex w-full justify-end">
            {is_done ? (
              <div className="space-y-4 w-fit">
                <Button
                  size="lg"
                  className="rounded-xl font-semibold relative py-4 text-md flex gap-2 items-center w-full"
                  onClick={downloadAll}
                  disabled={actions.some((action) => action.is_error)}
                >
                  {actions.length > 1 ? "Download All" : "Download"}
                  <HiOutlineDownload />
                </Button>
                <Button
                  size="lg"
                  onClick={reset}
                  variant="outline"
                  className="rounded-xl"
                >
                  Convert Another File(s)
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                disabled={!is_ready || is_converting}
                className="rounded-xl font-semibold relative py-4 text-md flex items-center w-44"
                onClick={convertFile}
              >
                {is_converting ? (
                  <span className="animate-spin text-lg">
                    <ImSpinner3 />
                  </span>
                ) : (
                  <span>Convert Now</span>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
