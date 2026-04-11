import {
  AlertTriangle,
  Check,
  Columns,
  Download,
  Expand,
  ImagePlus,
  Languages,
  LoaderCircle,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import {
  startTransition,
  useEffect,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from 'react';
import { normalizeAppLocale, type AppLocale } from '../../shared/app-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { generateImage } from '@/lib/api';
import { downloadDataUrl } from '@/lib/download';
import {
  getInitialLocale,
  messages,
  APP_LOCALE_STORAGE_KEY,
  localeOptions
} from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  type AspectRatio,
  type GenerateImagePayload,
  type GenerateImageResponse,
  getAspectRatioOptions,
  getImageSizeOptions,
  getModelDefinition,
  type GroundingConfig,
  type ImageModel,
  type ImageSize,
  imageModelOptions,
  type UploadedReferenceImage
} from '@/types/generation';

const DEFAULT_MODEL = 'gemini-3.1-flash-image-preview' satisfies ImageModel;
const DEFAULT_RESPONSE_MODE = 'image-only';
const MAX_REFERENCE_IMAGES = 14;
const CONCURRENT_IMAGE_OPTIONS = [1, 2, 3, 4] as const;

type ClientReferenceImage = UploadedReferenceImage & {
  id: string;
  previewDataUrl: string;
};

type GeneratedImageAsset = {
  id: string;
  batchId: string;
  slot: number;
  response: GenerateImageResponse;
};

type FullscreenTarget =
  | { kind: 'generated'; id: string }
  | { kind: 'reference'; id: string };

type BatchProgress = {
  total: number;
  finished: number;
  failed: number;
};

export function ImageGeneratorApp() {
  const [locale, setLocale] = useState<AppLocale>(getInitialLocale);
  const copy = messages[locale];
  const initialModel = getModelDefinition(DEFAULT_MODEL);
  const [model, setModel] = useState<ImageModel>(DEFAULT_MODEL);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialModel.defaultAspectRatio);
  const [imageSize, setImageSize] = useState<ImageSize | null>(
    initialModel.defaultImageSize ?? null
  );
  const [grounding, setGrounding] = useState<GroundingConfig>({
    webSearch: false,
    imageSearch: false
  });
  const [referenceImages, setReferenceImages] = useState<ClientReferenceImage[]>([]);
  const [historyImages, setHistoryImages] = useState<GeneratedImageAsset[]>([]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [focusedImageId, setFocusedImageId] = useState<string | null>(null);
  const [fullscreenTarget, setFullscreenTarget] = useState<FullscreenTarget | null>(null);
  const [concurrentCount, setConcurrentCount] = useState<number>(1);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReferenceExpanded, setIsReferenceExpanded] = useState<boolean>(true);
  const [comparedImageIds, setComparedImageIds] = useState<string[]>([]);

  const modelDefinition = getModelDefinition(model);
  const aspectRatioOptions = getAspectRatioOptions(model, locale);
  const imageSizeOptions = getImageSizeOptions(model, locale);
  const promptLength = prompt.trim().length;
  const isPromptReady = promptLength > 0;
  const isGenerating = batchProgress !== null;
  const shortcutModifier =
    typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl';
  const selectedHistorySet = new Set(selectedHistoryIds);
  const focusedImage =
    historyImages.find((asset) => asset.id === focusedImageId) ?? historyImages[0] ?? null;
  const fullscreenGeneratedImage =
    fullscreenTarget?.kind === 'generated'
      ? historyImages.find((asset) => asset.id === fullscreenTarget.id) ??
      (focusedImage?.id === fullscreenTarget.id ? focusedImage : null)
      : null;
  const fullscreenReferenceImage =
    fullscreenTarget?.kind === 'reference'
      ? referenceImages.find((image) => image.id === fullscreenTarget.id) ?? null
      : null;
  const previewAspectRatio = (focusedImage?.response.aspectRatio ?? aspectRatio).replace(':', ' / ');
  const allHistorySelected =
    historyImages.length > 0 && selectedHistoryIds.length === historyImages.length;
  const comparedImages = historyImages.filter((asset) => comparedImageIds.includes(asset.id));
  const compactSelectClassName = 'h-10 rounded-[18px] px-3 text-xs';

  useEffect(() => {
    if (!modelDefinition.aspectRatios.includes(aspectRatio)) {
      setAspectRatio(modelDefinition.defaultAspectRatio);
    }

    if (imageSizeOptions.length === 0) {
      if (imageSize !== null) {
        setImageSize(null);
      }
    } else if (!imageSize || !imageSizeOptions.some((option) => option.value === imageSize)) {
      const fallbackImageSize = modelDefinition.defaultImageSize ?? imageSizeOptions[0]?.value;

      if (fallbackImageSize) {
        setImageSize(fallbackImageSize);
      }
    }

    if (!modelDefinition.supportsWebGrounding && grounding.webSearch) {
      setGrounding((current) => ({ ...current, webSearch: false }));
    }

    if (!modelDefinition.supportsImageSearchGrounding && grounding.imageSearch) {
      setGrounding((current) => ({ ...current, imageSearch: false }));
    }
  }, [
    aspectRatio,
    grounding.imageSearch,
    grounding.webSearch,
    imageSize,
    imageSizeOptions,
    modelDefinition
  ]);

  useEffect(() => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
    document.title = copy.title;
    const description = document.querySelector('meta[name="description"]');

    if (description) {
      description.setAttribute(
        'content',
        locale === 'zh'
          ? 'Nano Banana UI 是一个基于 Gemini 图像生成 API 的现代感生图工作台。'
          : 'Nano Banana UI is a polished Gemini image generation workspace.'
      );
    }
  }, [copy.title, locale]);

  async function handleGenerate() {
    if (!isPromptReady) {
      setError(copy.promptRequiredError);
      return;
    }

    const batchId = `batch-${Date.now().toString()}`;
    const payload: GenerateImagePayload = {
      model,
      prompt,
      responseMode: DEFAULT_RESPONSE_MODE,
      aspectRatio,
      imageSize: imageSize ?? undefined,
      grounding,
      referenceImages: referenceImages.map((image) => ({
        name: image.name,
        mimeType: image.mimeType,
        data: image.data
      }))
    };

    setBatchProgress({
      total: concurrentCount,
      finished: 0,
      failed: 0
    });
    setError(null);

    const requests = Array.from({ length: concurrentCount }, (_, index) =>
      generateImage(payload, locale)
        .then((data) => {
          const asset = createGeneratedAsset(data, batchId, index + 1);

          startTransition(() => {
            setHistoryImages((current) => [asset, ...current]);
            setFocusedImageId(asset.id);
          });

          return asset;
        })
        .catch((generationError) => {
          setBatchProgress((current) =>
            current ? { ...current, failed: current.failed + 1 } : current
          );
          throw generationError;
        })
        .finally(() => {
          setBatchProgress((current) =>
            current ? { ...current, finished: current.finished + 1 } : current
          );
        })
    );

    const results = await Promise.allSettled(requests);
    const failedResults = results.filter((result) => result.status === 'rejected');

    setBatchProgress(null);

    if (failedResults.length === concurrentCount) {
      const firstError = failedResults[0];
      setError(
        firstError?.status === 'rejected' && firstError.reason instanceof Error
          ? firstError.reason.message
          : copy.generationFailedError
      );
      return;
    }

    if (failedResults.length > 0) {
      const firstError = failedResults[0];
      const reason =
        firstError?.status === 'rejected' && firstError.reason instanceof Error
          ? firstError.reason.message
          : undefined;
      setError(
        copy.partialFailureError(concurrentCount - failedResults.length, failedResults.length, reason)
      );
    }
  }

  async function handleReferenceImageChange(event: ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;

    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList);

    if (referenceImages.length + files.length > MAX_REFERENCE_IMAGES) {
      setError(copy.referenceLimitError(MAX_REFERENCE_IMAGES));
      event.target.value = '';
      return;
    }

    try {
      const nextImages = await Promise.all(files.map(readFileAsReferenceImage));
      appendReferenceImages(nextImages);
      setError(null);
    } catch {
      setError(copy.referenceReadError);
    } finally {
      event.target.value = '';
    }
  }

  function handlePromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      (event.metaKey || event.ctrlKey) &&
      event.key === 'Enter' &&
      !isGenerating &&
      isPromptReady
    ) {
      event.preventDefault();
      void handleGenerate();
    }
  }

  function appendReferenceImages(images: ClientReferenceImage[]) {
    setReferenceImages((current) => {
      const existingIds = new Set(current.map((image) => image.id));
      const dedupedImages = images.filter((image) => !existingIds.has(image.id));

      if (current.length + dedupedImages.length > MAX_REFERENCE_IMAGES) {
        setError(copy.referenceLimitError(MAX_REFERENCE_IMAGES));
        return current;
      }

      return dedupedImages.length > 0 ? [...current, ...dedupedImages] : current;
    });
  }

  function addAssetToReferences(asset: GeneratedImageAsset) {
    appendReferenceImages([createReferenceImageFromAsset(asset)]);
  }

  function removeReferenceImage(id: string) {
    setReferenceImages((current) => current.filter((image) => image.id !== id));

    if (fullscreenTarget?.kind === 'reference' && fullscreenTarget.id === id) {
      setFullscreenTarget(null);
    }
  }

  function removeHistoryAsset(id: string) {
    const nextImages = historyImages.filter((asset) => asset.id !== id);

    setHistoryImages(nextImages);
    setSelectedHistoryIds((current) => current.filter((item) => item !== id));
    setComparedImageIds((current) => current.filter((item) => item !== id));

    if (focusedImageId === id) {
      setFocusedImageId(nextImages[0]?.id ?? null);
    }

    if (fullscreenTarget?.kind === 'generated' && fullscreenTarget.id === id) {
      setFullscreenTarget(null);
    }
  }

  function toggleGrounding<K extends keyof GroundingConfig>(key: K) {
    setGrounding((current) => ({
      ...current,
      [key]: !current[key]
    }));
  }

  function toggleCompareAsset(id: string) {
    setComparedImageIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleHistorySelection(id: string) {
    setSelectedHistoryIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleSelectAllHistory() {
    setSelectedHistoryIds(allHistorySelected ? [] : historyImages.map((asset) => asset.id));
  }

  function handleLocaleChange(value: string) {
    setLocale(normalizeAppLocale(value));
  }

  function downloadAsset(asset: GeneratedImageAsset) {
    downloadDataUrl(asset.response.imageDataUrl, buildAssetFilename(asset));
  }

  function downloadSelectedHistory() {
    historyImages
      .filter((asset) => selectedHistorySet.has(asset.id))
      .forEach((asset) => downloadAsset(asset));
  }

  return (
    <>
      <main className="app-shell px-3 py-3 md:px-4 md:py-4">
        <div className="app-grid pointer-events-none absolute inset-0" />
        <div className="app-glow app-glow-a" />
        <div className="app-glow app-glow-b" />

        <div className="mx-auto flex h-full w-full max-w-[1920px] flex-col gap-3">
          <section className="liquid-panel liquid-panel-strong relative rounded-[24px] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <h1 className="min-w-0 truncate text-[1.25rem] font-semibold tracking-[-0.03em] text-slate-950 md:text-[1.4rem]">
                {copy.title}
              </h1>

              <div className="min-w-0 w-[160px] shrink-0 md:w-[180px]">
                <Select value={locale} onValueChange={handleLocaleChange}>
                  <SelectTrigger>
                    <Languages className="h-4 w-4 shrink-0 text-slate-700" />
                    <SelectValue placeholder={copy.languageLabel} />
                  </SelectTrigger>
                  <SelectContent>
                    {localeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section
            className={cn(
              'workspace-grid min-h-0 flex-1 gap-3',
              !isReferenceExpanded && 'workspace-grid-collapsed'
            )}
          >
            <Card className="workspace-sidebar h-full min-h-0 min-w-0 overflow-hidden rounded-[28px]">
              <CardContent className="panel-scroll flex h-full min-h-0 min-w-0 flex-col gap-1.5 overflow-hidden p-2.5">
                <section className="liquid-section rounded-[22px] p-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="prompt" className="text-slate-900">
                      {copy.promptLabel}
                    </Label>
                    <span className="panel-kicker whitespace-nowrap">
                      {copy.promptCounter(promptLength)}
                    </span>
                  </div>

                  <Textarea
                    id="prompt"
                    placeholder={copy.promptPlaceholder}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    onKeyDown={handlePromptKeyDown}
                    className="mt-2 min-h-[244px] resize-none rounded-[20px] px-3 py-2.5 text-xs leading-5"
                  />
                </section>

                <section className="liquid-section rounded-[22px] p-2">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="panel-kicker">{copy.controlsSectionTitle}</span>
                  </div>

                  <div className="controls-grid">
                    <CompactField label={copy.modelLabel}>
                      <Select value={model} onValueChange={(value) => setModel(value as ImageModel)}>
                        <SelectTrigger className={compactSelectClassName}>
                          <SelectValue placeholder={copy.modelLabel} />
                        </SelectTrigger>
                        <SelectContent>
                          {imageModelOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.shortLabel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CompactField>

                    <CompactField label={copy.aspectRatioLabel}>
                      <Select
                        value={aspectRatio}
                        onValueChange={(value) => setAspectRatio(value as AspectRatio)}
                      >
                        <SelectTrigger className={compactSelectClassName}>
                          <SelectValue placeholder={copy.aspectRatioLabel} />
                        </SelectTrigger>
                        <SelectContent>
                          {aspectRatioOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CompactField>

                    <CompactField label={copy.imageSizeLabel}>
                      {imageSizeOptions.length > 0 && imageSize ? (
                        <Select
                          value={imageSize}
                          onValueChange={(value) => setImageSize(value as ImageSize)}
                        >
                          <SelectTrigger className={compactSelectClassName}>
                            <SelectValue placeholder={copy.imageSizeLabel} />
                          </SelectTrigger>
                          <SelectContent>
                            {imageSizeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="liquid-note flex h-10 items-center rounded-[18px] px-3 text-xs font-medium text-slate-700">
                          {copy.defaultSize}
                        </div>
                      )}
                    </CompactField>

                    <CompactField label={copy.concurrentLabel}>
                      <Select
                        value={String(concurrentCount)}
                        onValueChange={(value) => setConcurrentCount(Number(value))}
                      >
                        <SelectTrigger className={compactSelectClassName}>
                          <SelectValue placeholder={copy.concurrentLabel} />
                        </SelectTrigger>
                        <SelectContent>
                          {CONCURRENT_IMAGE_OPTIONS.map((count) => (
                            <SelectItem key={count} value={String(count)}>
                              {count} {copy.imageUnit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CompactField>

                    <GroundingToggle
                      title={copy.webSearchLabel}
                      active={grounding.webSearch}
                      disabled={!modelDefinition.supportsWebGrounding}
                      onClick={() => toggleGrounding('webSearch')}
                    />

                    <GroundingToggle
                      title={copy.imageSearchLabel}
                      active={grounding.imageSearch}
                      disabled={!modelDefinition.supportsImageSearchGrounding}
                      onClick={() => toggleGrounding('imageSearch')}
                    />
                  </div>
                </section>

                <section className="liquid-section flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] p-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="panel-kicker whitespace-nowrap">{copy.referenceSectionTitle}</span>
                    <label htmlFor="reference-images" className="upload-cta cursor-pointer">
                      <ImagePlus className="h-4 w-4" />
                      {copy.uploadReference}
                    </label>
                    <input
                      id="reference-images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        void handleReferenceImageChange(event);
                      }}
                    />
                  </div>

                  {referenceImages.length > 0 ? (
                    <div className="reference-grid mt-1.5 min-h-0 flex-1">
                      {referenceImages.map((image) => (
                        <article
                          key={image.id}
                          className="asset-card reference-card group rounded-[18px]"
                        >
                          <img
                            src={image.previewDataUrl}
                            alt={image.name}
                            className="reference-thumb aspect-[4/3] w-full object-cover"
                          />
                          <div className="reference-actions">
                            <button
                              type="button"
                              onClick={() => setFullscreenTarget({ kind: 'reference', id: image.id })}
                              className="reference-action-button"
                              aria-label={copy.fullscreenPreview}
                              title={copy.fullscreenPreview}
                            >
                              <Expand className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeReferenceImage(image.id)}
                              className="reference-action-button reference-delete-button"
                              aria-label={copy.deleteReference(image.name)}
                              title={copy.deleteReferenceShort}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="compact-note mt-1.5 flex-1">{copy.noReference}</div>
                  )}
                </section>

                <section className="liquid-panel rounded-[22px] p-2">
                  <div className="flex flex-col gap-2">
                    <div className="status-strip">
                      <span className={cn('liquid-chip', isPromptReady && 'liquid-chip-active')}>
                        {isGenerating
                          ? copy.generatingStatus(
                            batchProgress?.finished ?? 0,
                            batchProgress?.total ?? concurrentCount
                          )
                          : copy.standbyStatus}
                      </span>
                      <span className="liquid-chip">
                        {copy.referenceImagesCount(referenceImages.length)}
                      </span>
                      <span className="panel-kicker whitespace-nowrap">
                        {copy.shortcutHint} {shortcutModifier} + Enter
                      </span>
                    </div>

                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        void handleGenerate();
                      }}
                      disabled={isGenerating || !isPromptReady}
                    >
                      {isGenerating ? (
                        <>
                          <LoaderCircle className="h-5 w-5 animate-spin" />
                          <span className="truncate">{copy.generatingButton}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          <span className="truncate">{copy.generateButton}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </section>
              </CardContent>
            </Card>

            <Card className="workspace-stage h-full min-h-0 min-w-0 overflow-hidden rounded-[28px]">
              <CardContent className="relative flex h-full min-h-0 min-w-0 flex-col p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="panel-kicker">{copy.generatedImageSectionTitle}</span>
                    <p className="mt-2 text-xs leading-5 text-slate-600/80">{copy.generatedImageHint}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {focusedImage ? (
                      <>
                        <IconButton
                          label={copy.addToReference}
                          onClick={() => addAssetToReferences(focusedImage)}
                          icon={<ImagePlus className="h-4 w-4" />}
                        />
                        <IconButton
                          label={copy.downloadSelected}
                          onClick={() => downloadAsset(focusedImage)}
                          icon={<Download className="h-4 w-4" />}
                        />
                        <IconButton
                          label={copy.fullscreenPreview}
                          onClick={() => setFullscreenTarget({ kind: 'generated', id: focusedImage.id })}
                          icon={<Expand className="h-4 w-4" />}
                        />
                      </>
                    ) : null}
                    <IconButton
                      label={isReferenceExpanded ? copy.collapseHistory : copy.expandHistory}
                      onClick={() => setIsReferenceExpanded((prev) => !prev)}
                      icon={
                        isReferenceExpanded ? (
                          <PanelRightClose className="h-4 w-4" />
                        ) : (
                          <PanelRightOpen className="h-4 w-4" />
                        )
                      }
                    />
                  </div>
                </div>

                <div className="flex h-full min-h-0 min-w-0 gap-3">
                  <section
                    className={cn(
                      'stage-panel relative min-h-0 flex-col rounded-[26px]',
                      comparedImages.length > 0 ? 'flex-[3]' : 'flex-1'
                    )}
                  >
                    <div
                      className="stage-canvas flex min-h-0 w-full flex-1 items-center justify-center p-0"
                      style={{ aspectRatio: previewAspectRatio }}
                    >
                      {focusedImage ? (
                        <img
                          src={focusedImage.response.imageDataUrl}
                          alt={focusedImage.response.prompt}
                          className="stage-image h-full w-full object-contain"
                        />
                      ) : (
                        <ResultPlaceholder
                          copy={copy}
                          error={error}
                          isGenerating={isGenerating}
                          isPromptReady={isPromptReady}
                          requestedCount={batchProgress?.total ?? concurrentCount}
                          onGenerate={handleGenerate}
                        />
                      )}

                      {focusedImage && error ? (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                          <div className="alert-panel pointer-events-auto max-w-[420px] rounded-[22px] px-4 py-3 text-center text-sm leading-6 text-slate-900">
                            {error}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </section>

                  {comparedImages.length > 0 ? (
                    <section className="compare-panel-sidebar">
                      {comparedImages.map((asset) => (
                        <div key={asset.id} className="compare-asset-card group">
                          <img
                            src={asset.response.imageDataUrl}
                            alt={asset.response.prompt}
                            className="compare-asset-img"
                          />
                          <div className="compare-asset-overlay" />
                          <div className="compare-asset-actions">
                            <IconButton
                              label={copy.cancelCompare}
                              onClick={() => toggleCompareAsset(asset.id)}
                              icon={<X className="h-3.5 w-3.5" />}
                            />
                            <IconButton
                              label={copy.fullscreenPreview}
                              onClick={() => setFullscreenTarget({ kind: 'generated', id: asset.id })}
                              icon={<Expand className="h-3.5 w-3.5" />}
                            />
                          </div>
                        </div>
                      ))}
                    </section>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="workspace-history h-full min-h-0 min-w-0 overflow-hidden rounded-[28px]">
              <CardContent className="panel-scroll flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div
                    className="history-warning min-w-0 rounded-[999px] px-3 py-2 text-xs font-medium"
                    title={copy.historyPersistenceHint}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate whitespace-nowrap">{copy.historyPersistenceHint}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <IconButton
                      label={allHistorySelected ? copy.clearSelection : copy.selectAll}
                      onClick={toggleSelectAllHistory}
                      icon={<Check className="h-4 w-4" />}
                      disabled={!historyImages.length}
                    />
                    <IconButton
                      label={copy.downloadSelected}
                      onClick={downloadSelectedHistory}
                      icon={<Download className="h-4 w-4" />}
                      disabled={!selectedHistoryIds.length}
                    />
                  </div>
                </div>

                {historyImages.length > 0 ? (
                  <div className="history-list min-h-0 flex-1 overflow-auto pr-1">
                    {historyImages.map((asset) => {
                      const isSelected = selectedHistorySet.has(asset.id);
                      const isFocused = focusedImage?.id === asset.id;

                      return (
                        <article
                          key={asset.id}
                          className={cn(
                            'history-card asset-card cursor-pointer rounded-[22px] p-2.5 group',
                            isFocused && 'history-card-focused',
                            isSelected && 'history-card-selected'
                          )}
                          onClick={() => {
                            setFocusedImageId(asset.id);
                            toggleHistorySelection(asset.id);
                          }}
                        >
                          <div className="history-card-media relative">
                            <div className="history-card-container">
                              <img
                                src={asset.response.imageDataUrl}
                                alt={asset.response.prompt}
                                className="history-thumb aspect-[4/3] w-full object-cover"
                              />

                              <div className="history-overlay-bottom">
                                <IconButton
                                  label={
                                    comparedImageIds.includes(asset.id)
                                      ? copy.cancelCompare
                                      : copy.compareImage
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    toggleCompareAsset(asset.id);
                                  }}
                                  icon={<Columns className="h-4 w-4" />}
                                />
                                <IconButton
                                  label={copy.addToReference}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    addAssetToReferences(asset);
                                  }}
                                  icon={<ImagePlus className="h-4 w-4" />}
                                />
                                <IconButton
                                  label={copy.fullscreenPreview}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setFullscreenTarget({ kind: 'generated', id: asset.id });
                                  }}
                                  icon={<Expand className="h-4 w-4" />}
                                />
                                <IconButton
                                  label={copy.deleteHistory}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    removeHistoryAsset(asset.id);
                                  }}
                                  icon={<Trash2 className="h-4 w-4" />}
                                />
                              </div>
                            </div>

                            <div className="history-card-body">
                              <p className="history-card-title" title={asset.response.prompt}>
                                {asset.response.prompt}
                              </p>
                              <div className="history-card-meta">
                                <span>{asset.response.aspectRatio}</span>
                                <span className="history-card-meta-dot" />
                                <span>{getModelDefinition(asset.response.model).shortLabel}</span>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="compact-note">{copy.noHistory}</div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      {fullscreenGeneratedImage || fullscreenReferenceImage ? (
        <div className="lightbox-overlay" role="dialog" aria-modal="true">
          <div className="lightbox-toolbar">
            {fullscreenGeneratedImage ? (
              <>
                <IconButton
                  label={copy.addToReference}
                  onClick={() => addAssetToReferences(fullscreenGeneratedImage)}
                  icon={<ImagePlus className="h-4 w-4" />}
                />
                <IconButton
                  label={copy.downloadSelected}
                  onClick={() => downloadAsset(fullscreenGeneratedImage)}
                  icon={<Download className="h-4 w-4" />}
                />
              </>
            ) : null}
            {fullscreenReferenceImage ? (
              <IconButton
                label={copy.deleteReference(fullscreenReferenceImage.name)}
                onClick={() => removeReferenceImage(fullscreenReferenceImage.id)}
                icon={<Trash2 className="h-4 w-4" />}
              />
            ) : null}
            <IconButton
              label={copy.closePreview}
              onClick={() => setFullscreenTarget(null)}
              icon={<X className="h-4 w-4" />}
            />
          </div>

          <div className="lightbox-stage" onClick={() => setFullscreenTarget(null)}>
            <img
              src={fullscreenGeneratedImage?.response.imageDataUrl ?? fullscreenReferenceImage?.previewDataUrl}
              alt={fullscreenGeneratedImage?.response.prompt ?? fullscreenReferenceImage?.name ?? ''}
              className="lightbox-image"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function CompactField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-[11px] font-semibold tracking-[0.08em] text-slate-700/84 uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}

function GroundingToggle({
  title,
  active,
  disabled,
  onClick
}: {
  title: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'toggle-card flex min-h-10 items-center justify-center rounded-[18px] px-3 py-2 text-center',
        active && 'toggle-card-active',
        disabled && 'cursor-not-allowed opacity-55'
      )}
      aria-pressed={active}
    >
      <span className="truncate text-sm font-semibold text-slate-950">{title}</span>
    </button>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  disabled = false
}: {
  label: string;
  icon: ReactNode;
  onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="icon-pill"
      aria-label={label}
      title={label}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}

function ResultPlaceholder({
  copy,
  error,
  isGenerating,
  isPromptReady,
  requestedCount,
  onGenerate
}: {
  copy: (typeof messages)[AppLocale];
  error: string | null;
  isGenerating: boolean;
  isPromptReady: boolean;
  requestedCount: number;
  onGenerate: () => Promise<void>;
}) {
  return (
    <div className="preview-empty flex h-full w-full max-w-[460px] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="icon-orb h-16 w-16">
        {isGenerating ? (
          <LoaderCircle className="h-7 w-7 animate-spin text-slate-900" />
        ) : error ? (
          <X className="h-7 w-7 text-slate-900" />
        ) : (
          <Sparkles className="h-7 w-7 text-slate-900" />
        )}
      </div>

      <div>
        <p className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
          {isGenerating
            ? copy.emptyStateGenerating(requestedCount)
            : error ?? copy.emptyStateTitle}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600/85">
          {copy.emptyStateHint}
        </p>
      </div>

      {!isGenerating ? (
        <Button
          size="lg"
          className="min-w-[220px]"
          onClick={() => {
            void onGenerate();
          }}
          disabled={!isPromptReady}
        >
          <Sparkles className="h-5 w-5" />
          <span className="truncate">{copy.emptyStateAction}</span>
        </Button>
      ) : null}
    </div>
  );
}

function createGeneratedAsset(
  response: GenerateImageResponse,
  batchId: string,
  slot: number
): GeneratedImageAsset {
  return {
    id: `${batchId}-${slot}-${response.generatedAt}`,
    batchId,
    slot,
    response
  };
}

function createReferenceImageFromAsset(asset: GeneratedImageAsset): ClientReferenceImage {
  const [header, data] = asset.response.imageDataUrl.split(',', 2);

  if (!data) {
    throw new Error('Invalid image payload');
  }

  const mimeType =
    header?.match(/data:(.*?);base64/)?.[1] ?? asset.response.mimeType ?? 'image/png';

  return {
    id: `generated-${asset.id}`,
    name: buildAssetFilename(asset),
    mimeType,
    data,
    previewDataUrl: asset.response.imageDataUrl
  };
}

function buildAssetFilename(asset: GeneratedImageAsset) {
  const extension = getFileExtension(asset.response.mimeType);
  return `nano-banana-${asset.batchId}-${String(asset.slot).padStart(2, '0')}.${extension}`;
}

function getFileExtension(mimeType: string) {
  if (mimeType === 'image/jpeg') {
    return 'jpg';
  }

  if (mimeType === 'image/webp') {
    return 'webp';
  }

  return 'png';
}

async function readFileAsReferenceImage(file: File): Promise<ClientReferenceImage> {
  const previewDataUrl = await readFileAsDataUrl(file);
  const data = previewDataUrl.split(',', 2)[1];

  if (!data) {
    throw new Error('Invalid image payload');
  }

  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    mimeType: file.type || 'image/png',
    data,
    previewDataUrl
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Unable to read file'));
    };

    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}
