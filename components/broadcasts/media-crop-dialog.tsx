"use client";

import { useCallback, useEffect, useState } from "react";
import { Crop } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Aspect = "1:1" | "9:16";

function aspectRatio(aspect: Aspect) {
  return aspect === "9:16" ? 9 / 16 : 1;
}

async function cropImageDataUrl(source: string, aspect: Aspect): Promise<string> {
  const image = await loadImage(source);
  const targetRatio = aspectRatio(aspect);
  const srcRatio = image.width / image.height;
  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;
  if (srcRatio > targetRatio) {
    sw = image.height * targetRatio;
    sx = (image.width - sw) / 2;
  } else {
    sh = image.width / targetRatio;
    sy = (image.height - sh) / 2;
  }
  const outW = aspect === "9:16" ? 1080 : 1080;
  const outH = aspect === "9:16" ? 1920 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outW, outH);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function MediaCropDialog({
  open,
  imageUrl,
  defaultAspect = "1:1",
  onOpenChange,
  onApply,
}: {
  open: boolean;
  imageUrl: string | null;
  defaultAspect?: Aspect;
  onOpenChange: (open: boolean) => void;
  onApply: (croppedUrl: string) => void;
}) {
  const [aspect, setAspect] = useState<Aspect>(defaultAspect);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAspect(defaultAspect);
  }, [defaultAspect, imageUrl]);

  const apply = useCallback(async () => {
    if (!imageUrl) return;
    setBusy(true);
    try {
      const cropped = await cropImageDataUrl(imageUrl, aspect);
      onApply(cropped);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }, [aspect, imageUrl, onApply, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-4 w-4" />
            Crop media
          </DialogTitle>
          <DialogDescription>Center-crop for Instagram feed (1:1) or Reel/Story (9:16).</DialogDescription>
        </DialogHeader>
        {imageUrl ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              {(["1:1", "9:16"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAspect(item)}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                    aspect === item
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-border bg-muted/40 hover:bg-muted/60",
                  )}
                >
                  {item === "1:1" ? "Square · Feed" : "Vertical · Reel/Story"}
                </button>
              ))}
            </div>
            <div
              className="mx-auto flex max-h-[50vh] items-center justify-center overflow-hidden rounded-xl bg-black/5"
              style={{ aspectRatio: aspectRatio(aspect) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="max-h-full max-w-full object-cover" />
            </div>
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={busy || !imageUrl} onClick={() => void apply()}>
            {busy ? "Cropping…" : "Apply crop"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
