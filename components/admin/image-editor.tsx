'use client';

import { useState } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageEditorProps {
  imageSrc: string;
  onSave: (croppedImage: File) => void;
  onCancel: () => void;
}

export default function ImageEditor({ imageSrc, onSave, onCancel }: ImageEditorProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 70,
    x: 10,
    y: 10,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const image = e.currentTarget;
    setImageRef(image);
    const container = image.parentElement?.parentElement;
    const containerWidth = container?.clientWidth || 400;
    const containerHeight = container?.clientHeight || 300;
    const scale = Math.min(containerWidth / image.width, containerHeight / image.height, 1);
    const fittedWidth = image.width * scale;
    const fittedHeight = image.height * scale;
    setCrop({
      unit: 'px',
      x: Math.max(0, (containerWidth - fittedWidth) / 2),
      y: Math.max(0, (containerHeight - fittedHeight) / 2),
      width: fittedWidth,
      height: fittedHeight,
    });
  };

  const getCroppedImg = async (image: HTMLImageElement, nextCrop: PixelCrop): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = nextCrop.width;
    canvas.height = nextCrop.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      nextCrop.x * scaleX,
      nextCrop.y * scaleY,
      nextCrop.width * scaleX,
      nextCrop.height * scaleY,
      0,
      0,
      nextCrop.width,
      nextCrop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    if (!imageRef || !completedCrop) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageRef, completedCrop);
      if (croppedBlob) {
        onSave(new File([croppedBlob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close image editor" onClick={onCancel} />
      <div className="relative z-10 flex h-[90dvh] w-full max-w-3xl flex-col rounded-t-3xl bg-white p-5 dark:bg-slate-900 sm:h-[80dvh] sm:rounded-3xl">
        <h3 className="text-lg font-extrabold">Edit image</h3>
        <div className="mt-4 min-h-0 flex-1 overflow-hidden">
          <ReactCrop crop={crop} onChange={setCrop} onComplete={setCompletedCrop} minWidth={50} minHeight={50}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt="Edit"
              onLoad={onImageLoad}
              className="max-h-[70%] max-w-[80%] object-contain"
            />
          </ReactCrop>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="h-10 rounded-full border border-black/10 px-4 text-sm font-semibold dark:border-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!completedCrop || isProcessing}
            className="h-10 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isProcessing ? 'Processing…' : 'Save image'}
          </button>
        </div>
      </div>
    </div>
  );
}
