'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AvatarCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropped: (blob: Blob) => void;
}

export function AvatarCropModal({ open, onOpenChange, imageSrc, onCropped }: AvatarCropModalProps) {
  const t = useTranslations('profile');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [processing, setProcessing] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const initial = centerCrop(
      makeAspectCrop({ unit: '%', width: 80 }, 1, naturalWidth, naturalHeight),
      naturalWidth, naturalHeight,
    );
    setCrop(initial);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;
    setProcessing(true);

    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setProcessing(false); return; }

    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0, size, size,
    );

    canvas.toBlob(
      (blob) => {
        if (blob) onCropped(blob);
        setProcessing(false);
      },
      'image/webp',
      0.85,
    );
  }, [completedCrop, onCropped]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111318] border-white/[0.06] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{t('cropAvatar')}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center [&_.ReactCrop__crop-selection]:!border-gold-500">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-[60vh]"
            />
          </ReactCrop>
        </div>
        <DialogFooter className="bg-transparent border-white/[0.06]">
          <Button
            variant="outline"
            className="border-white/10 text-white/60 hover:bg-white/5"
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!completedCrop || processing}
            className="bg-gold-500 text-black font-semibold hover:bg-gold-400"
          >
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('cropConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
