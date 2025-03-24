"use client";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import "pdfjs-dist/build/pdf.worker.min.mjs";
// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
//   import.meta.url
// ).toString();
// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

export default function PDFViewer({
  children,
  pdfStringData,
  currPage,
  setTotalPage,
  setDimension,
  setCanvasDimension,
}: {
  children: ReactNode;
  pdfStringData: string;
  currPage: number;
  setTotalPage(total: number): void;
  setDimension(data: { w: number; h: number }): void;
  setCanvasDimension(data: { w: number; h: number }): void;
}) {
  const [pageRendering, setPageRendering] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const container = useRef<HTMLDivElement>(null);

  const loadPdf = () => {
    const pdfData = Buffer.from(pdfStringData, "base64");
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useSystemFonts: true,
    });

    loadingTask.promise.then((pdf) => {
      console.log("PDF Loaded with pages " + pdf.numPages);
      setPageRendering(true);
      setTotalPage(pdf.numPages);
      pdf.getPage(currPage).then((page) => {
        const viewportNormal = page.getViewport({ scale: 1 });
        setDimension({
          w: viewportNormal.width,
          h: viewportNormal.height,
        });
        const viewport = page.getViewport({ scale: 5 });

        let canvasInHTML: {
          canvas: HTMLCanvasElement | undefined;
          ctx: CanvasRenderingContext2D | null;
        } = {
          canvas: undefined,
          ctx: null,
        };

        canvasInHTML.canvas = document.createElement("canvas");
        canvasInHTML.ctx = canvasInHTML.canvas.getContext("2d");
        canvasInHTML.canvas.height = viewport.height;
        canvasInHTML.canvas.width = viewport.width;

        if (canvasInHTML.ctx && canvasInHTML.canvas) {
          if (container.current) {
            container.current.append(canvasInHTML.canvas);
          }

          const renderContext = {
            canvasContext: canvasInHTML.ctx,
            viewport,
          };
          let renderTask = page.render(renderContext);

          renderTask.promise.then(() => {
            // console.log(canvasInHTML?.canvas?.toDataURL("image/jpeg"));
            if (canvasInHTML.canvas) {
              setImage(canvasInHTML?.canvas?.toDataURL("image/jpeg"));
              //   if (imageRef.current) {
              //     console.log(imageRef.current.width, imageRef.current.height);
              //     setCanvasDimension({
              //       w: imageRef.current.width,
              //       h: imageRef.current.height,
              //     });
              //   }
              setPageRendering(false);
            }
          });
        }
      });
    });
  };

  useEffect(() => {
    loadPdf();
  }, [currPage, pdfStringData]);

  // useLayoutEffect(() => {
  //   function updateSize() {
  //     if (imageRef.current) {
  //       setCanvasDimension({
  //         w: imageRef.current?.width,
  //         h: imageRef.current?.height,
  //       });
  //     }
  //   }

  //   window.addEventListener("resize", updateSize);

  //   return () => window.removeEventListener("resize", updateSize);
  // }, []);

  return (
    <div className="h-screen w-screen relative">
      <div>
        <img
          ref={imageRef}
          src={`${image}`}
          className="border h-screen"
          alt=""
          onLoad={(e) =>
            setCanvasDimension({
              w: e.currentTarget.width,
              h: e.currentTarget.height,
            })
          }
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          width: `${imageRef.current?.width}px`,
          height: `${imageRef.current?.height}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
