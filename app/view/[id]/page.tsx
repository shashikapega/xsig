"use client";

import { verifyUnique, getPdfFile, deletePdfFile } from "@/app/actions/_server";
import { Signature } from "@/app/page";
import PDFViewer from "@/components/PDFViewer";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { xorDecrypt } from "@/lib/encryption";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconQrcode,
  IconRubberStamp,
  IconSignature,
  IconTrash,
} from "@tabler/icons-react";
import axios from "axios";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NumberSize, Resizable } from "re-resizable";
import { useEffect, useLayoutEffect, useState } from "react";
import Draggable from "react-draggable";
import toast from "react-hot-toast";

export default function Viewer({ params }: { params: { id: string } }) {
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const [pdf, setPdf] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [canvasDimension, setCanvasDimension] = useState({
    w: 0,
    h: 0,
  });
  const [dimension, setDimension] = useState({
    w: 0,
    h: 0,
  });
  const [notFound, setNotFound] = useState(false);
  const [activeSignature, setActiveSignature] = useState<string | null>(null);
  const [currPage, setCurrPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [useSign, setUseSign] = useState(false);
  const [useEmet, setUseEmet] = useState(false);
  const [useStamp, setUseStamp] = useState(false);

  function formulaCoordinate(location: {
    x: number;
    y: number;
    w: number;
    h: number;
  }) {
    const llx = Math.round(location.x); // Lower Left X
    const lly = Math.round(location.y); // Lower Left Y
    const urx = Math.round(location.x + location.w); // Upper Right X
    const ury = Math.round(location.y + location.h); // Upper Right Y

    return {
      llx,
      lly,
      urx,
      ury,
    };
  }

  useEffect(() => {
    if (params.id) {
      getPdfFile(params.id)
        .then((res) => {
          if (res?.pdf) {
            // console.log(res.pdf);
            verifyUnique(params.id, searchParams.get("uid") as string)
              .then(() => {
                setPdf(xorDecrypt(res.pdf));
                setNotFound(false);
              })
              .catch(() => {
                setNotFound(true);
              });
          } else {
            setNotFound(true);
          }
        })
        .catch(() => setNotFound(true));

      // axios
      //   .get("/api/file", {
      //     params: {
      //       id: params.id,
      //     },
      //   })
      //   .then((res) => {
      //     // console.log(res.data.services);

      //     if (res.data?.pdf) {
      //       axios
      //         .get("/api/unique", {
      //           params: {
      //             id: params.id,
      //             uid: searchParams.get("uid") as string,
      //           },
      //         })
      //         .then(() => {
      //           setPdf(res.data?.pdf);
      //           setNotFound(false);
      //         })
      //         .catch(() => {
      //           setNotFound(true);
      //         });
      //     } else {
      //       setNotFound(true);
      //     }
      //   })
      //   .catch(() => setNotFound(true));
    }
  }, [params.id]);

  const removeFilePdf = (id: string) => {
    axios.delete("/api/file", {
      params: {
        id: id,
      },
    });
  };

  useEffect(() => {
    const handleResize = () => {
      window.location.reload();
    };

    window.addEventListener("resize", handleResize);

    const services = (searchParams.get("services") as string).split(",");
    if (services) {
      if (Array.isArray(services) && services?.includes("SIGN")) {
        setUseSign(true);
      }
      if (Array.isArray(services) && services?.includes("EMETERAI")) {
        setUseEmet(true);
      }
      if (Array.isArray(services) && services?.includes("STAMP")) {
        setUseStamp(true);
      }
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (pdf) {
      axios.delete("/api/unique", {
        params: {
          id: params.id,
          uid: searchParams.get("uid") as string,
        },
      });
      deletePdfFile(params.id);
    }
  }, [pdf]);

  const addSignature = (type: "SIGNATURE" | "EMETERAI" | "STAMP") => {
    setSignatures([
      ...signatures,
      {
        id: `${Date.now()}`,
        w: type === "SIGNATURE" ? 100 : 60,
        h: 60,
        wFinal: 100,
        hFinal: 100,
        page: currPage,
        x: 0,
        y: 0,
        type,
        xFinal: 0,
        yFinal: 0,
      },
    ]);
  };

  const handleResize = (signature: Signature, d: NumberSize) => {
    const other = signatures.filter((v) => v.id !== signature.id);
    (signature.w = signature.w + d.width),
      (signature.h = signature.h + d.height);

    const canvasWidth = canvasDimension.w;
    const canvasHeight = canvasDimension.h;

    const height = dimension.h;
    const width = dimension.w;

    const scale = width / canvasWidth;

    const signheight = signature.h * scale;
    const signwidth = signature.w * scale;

    const lower_left_x = signature.x * scale;
    const lower_left_y = height - signature.y * scale - signheight;

    signature.wFinal = parseInt(signheight.toFixed(0));
    signature.hFinal = parseInt(signwidth.toFixed(0));
    signature.xFinal = parseInt(lower_left_x.toFixed(0));
    signature.yFinal = parseInt(lower_left_y.toFixed(0));

    setSignatures([...other, signature]);
  };

  const removeSignature = (id: string) => {
    const filtered = signatures.filter((v) => v.id !== id);
    setSignatures(filtered);
  };

  const handleDragStop = (position: any, id: string) => {
    const index = signatures.findIndex((v) => v.id === activeSignature);
    if (index != -1) {
      const signature = signatures[index];
      signature.x = position.x;
      signature.y = position.y;

      const canvasWidth = canvasDimension.w;
      const canvasHeight = canvasDimension.h;

      const height = dimension.h;
      const width = dimension.w;

      const scale = width / canvasWidth;
      // const scale = 1;

      const signheight = signature.h * scale;
      const signwidth = signature.w * scale;

      const lower_left_x = position.x * scale;
      const lower_left_y = height - position.y * scale - signheight;

      signature.wFinal = parseInt(signwidth.toFixed(0));
      signature.hFinal = parseInt(signheight.toFixed(0));
      signature.xFinal = parseInt(lower_left_x.toFixed(0));
      signature.yFinal = parseInt(lower_left_y.toFixed(0));

      const other = signatures.filter((v) => v.id !== id);

      setSignatures([...other, signature]);
    }
  };

  // useEffect(() => {
  //   // console.log(signatures);
  // }, [signatures]);

  // useEffect(() => {
  //   console.log(dimension);
  //   console.log(canvasDimension);
  // }, [dimension, canvasDimension]);

  const submitCoordinate = () => {
    console.log(canvasDimension, dimension);

    const result = signatures.map((signature) => {
      const { llx, lly, urx, ury } = formulaCoordinate({
        w: signature.wFinal,
        h: signature.hFinal,
        x: signature.xFinal,
        y: signature.yFinal,
      });

      return {
        id: params.id,
        userId: searchParams.get("member") as string,
        type: signature.type,
        width: signature.wFinal,
        height: signature.hFinal,
        x: signature.xFinal,
        y: signature.yFinal,
        page: signature.page,
        llx,
        lly,
        urx,
        ury,
      };
    });

    console.log(result);

    axios
      .post(searchParams.get("callback") as string, result)
      .then(({ data }) => {
        toast.success(
          "Signature successfully set. window will close automaticly in 1 second."
        );
        setTimeout(() => {
          window.close();
        }, 1000);
      })
      .catch((err) => {
        console.log(err);
        if (axios.isAxiosError(err)) {
          toast.error(err.message);
          return;
        }

        toast.error(err.message);
      });

    // const query = new URLSearchParams();
    // query.set(
    //   "result",
    //   Buffer.from(JSON.stringify(result), "utf-8").toString("base64")
    // );

    // // router.replace(`${pathName}?${query.toString()}`);
    // window.location.href = `${searchParams.get(
    //   "callback"
    // )}?${query.toString()}`;
  };

  if (!pdf) {
    return (
      <div className="w-screen h-screen flex flex-col gap-4 items-center justify-center">
        {notFound ? (
          <h1 className="text-2xl">Invalid URL</h1>
        ) : (
          <h1 className="text-2xl">Loading PDF</h1>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen bg-slate-200 items-center gap-4">
      <div className="flex flex-col gap-2 px-6">
        <Button
          size={"icon"}
          className="rounded-full"
          disabled={currPage === totalPage}
          onClick={() => {
            setCurrPage(currPage + 1);
          }}
        >
          <IconChevronRight size={20} />
        </Button>
        <Button className="rounded-full" variant={"outline"} size={"icon"}>
          {currPage} / {totalPage}
        </Button>
        <Button
          size={"icon"}
          className="rounded-full mb-10"
          disabled={currPage === 1}
          onClick={() => {
            setCurrPage(currPage - 1);
          }}
        >
          <IconChevronLeft size={20} />
        </Button>
        {useSign && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size={"icon"}
                  className="rounded-full"
                  onClick={() => {
                    addSignature("SIGNATURE");
                  }}
                >
                  <IconSignature size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Digital Signature</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {useEmet && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size={"icon"}
                  className="rounded-full bg-pink-600 hover:bg-pink-500"
                  onClick={() => {
                    addSignature("EMETERAI");
                  }}
                >
                  <IconQrcode size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>e-Meterai</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {useStamp && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size={"icon"}
                  className="rounded-full bg-orange-600 hover:bg-orange-500"
                  onClick={() => {
                    addSignature("STAMP");
                  }}
                >
                  <IconRubberStamp size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Electronic Stamp</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <Button
          size={"icon"}
          className="rounded-full bg-green-600 hover:bg-green-500 disabled:cursor-not-allowed"
          onClick={() => {
            submitCoordinate();
          }}
          disabled={signatures.length === 0}
        >
          <IconCheck size={20} />
        </Button>
      </div>
      {pdf && (
        <div>
          <PDFViewer
            currPage={currPage}
            pdfStringData={pdf}
            setCanvasDimension={setCanvasDimension}
            setDimension={setDimension}
            setTotalPage={setTotalPage}
          >
            {signatures.map((signature) => (
              <Draggable
                bounds="parent"
                defaultClassName={`absolute inset-0 ${
                  currPage === signature.page ? "" : "hidden"
                }`}
                handle=".handle"
                key={signature.id}
                position={{
                  x: signature.x,
                  y: signature.y,
                }}
                onStop={(e, position) => handleDragStop(position, signature.id)}
                onMouseDown={() => {
                  setActiveSignature(signature.id);
                }}
              >
                <div
                  className="flex flex-col"
                  style={{
                    width: signature.w + "px",
                    height: signature.h + "px",
                  }}
                >
                  <Resizable
                    size={{
                      width: signature.w,
                      height: signature.h,
                    }}
                    onResizeStop={(e, direction, ref, d) => {
                      handleResize(signature, d);
                    }}
                    lockAspectRatio={signature.type === "EMETERAI"}
                    enable={{
                      top: false,
                      bottom: true,
                      right: true,
                      left: false,
                      topLeft: false,
                      topRight: false,
                      bottomLeft: false,
                      bottomRight: true,
                    }}
                  >
                    <div
                      className={`w-full border border-black border-dashed h-full flex flex-col`}
                    >
                      <div className="flex justify-between z-20">
                        <div className="flex items-center absolute -left-7 -top-1">
                          <button
                            className="text-md text-red-600 p-1"
                            onClick={() => removeSignature(signature.id)}
                          >
                            <IconTrash size={20} />
                          </button>
                        </div>
                        {/* <div className="flex">
                      <button className="text-md text-slate-600 p-1 handle">
                        <PiArrowsOutCardinalDuotone />
                      </button>
                    </div> */}
                      </div>
                      <div className="w-full h-full flex items-center justify-center absolute handle">
                        <p className="text-center text-primary-700 cursor-pointer px-1 text-2xl">
                          {signature.type === "EMETERAI" && <IconQrcode />}
                          {signature.type === "SIGNATURE" && <IconSignature />}
                          {signature.type === "STAMP" && <IconRubberStamp />}
                        </p>
                      </div>
                    </div>
                  </Resizable>
                </div>
              </Draggable>
            ))}
          </PDFViewer>
        </div>
      )}
    </div>
  );
}
