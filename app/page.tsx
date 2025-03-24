"use client";
import { cookies } from "next/headers";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getCookies } from "./actions/_server";
import PDFViewer from "@/components/PDFViewer";
import Draggable from "react-draggable";
import { NumberSize, Resizable } from "re-resizable";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconQrcode,
  IconSignature,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export type Signature = {
  id: string;
  x: number;
  y: number;
  page: number;
  xFinal: number;
  yFinal: number;
  w: number;
  h: number;
  wFinal: number;
  hFinal: number;
  type: "SIGNATURE" | "EMETERAI" | "STAMP";
};

export default function Home() {
  const router = useRouter();
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
  const [page, setPage] = useState(1);
  const [activeSignature, setActiveSignature] = useState<string | null>(null);
  const [currPage, setCurrPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

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
    window.addEventListener("message", (event) => {
      // console.log(event);
      // console.log(JSON.stringify(event), "response");
      alert(JSON.stringify(event));
    });
  }, []);

  const addSignature = (type: "SIGNATURE" | "EMETERAI") => {
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
    const result = signatures.map((signature) => {
      const { llx, lly, urx, ury } = formulaCoordinate({
        w: signature.wFinal,
        h: signature.hFinal,
        x: signature.xFinal,
        y: signature.yFinal,
      });

      return {
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

    const query = new URLSearchParams();
    query.set(
      "result",
      Buffer.from(JSON.stringify(result), "utf-8").toString("base64")
    );

    router.push(`/?${query.toString()}`);
  };

  if (!pdf) {
    return (
      <div className="w-screen h-screen flex flex-col gap-4 items-center justify-center">
        <h1 className="text-2xl">PDF not loaded</h1>
        <p>set pdf to sessionStorage with Base64 Encoded PDF file</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-200 items-center gap-4">
      <div className="flex flex-col gap-2">
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
        <Button
          size={"icon"}
          className="rounded-full"
          onClick={() => {
            addSignature("SIGNATURE");
          }}
        >
          <IconSignature size={20} />
        </Button>

        <Button
          size={"icon"}
          className="rounded-full bg-pink-600 hover:bg-pink-500"
          onClick={() => {
            addSignature("EMETERAI");
          }}
        >
          <IconQrcode size={20} />
        </Button>

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
