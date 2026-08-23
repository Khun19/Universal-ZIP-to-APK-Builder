import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {HeadshotService} from '../../services/headshot.service';

@Component({
  selector: 'app-comparison-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (item(); as headshot) {
      <div
        id="compare-modal-backdrop"
        class="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      >
        <!-- Backdrop click surface -->
        <button
          type="button"
          class="fixed inset-0 w-full h-full cursor-default bg-transparent border-0"
          (click)="service.closeCompareModal()"
          aria-label="Close modal background"
        ></button>

        <div
          class="relative z-10 w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <!-- Header -->
          <div class="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center">
                <mat-icon class="text-lg">compare</mat-icon>
              </div>
              <div>
                <h2 class="text-sm sm:text-base font-bold text-white">Before & After Likeness Comparison</h2>
                <p class="text-xs text-slate-400">Casual Reference Selfie vs. {{ headshot.styleName }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                id="compare-download-btn"
                (click)="service.downloadImage(headshot)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors cursor-pointer"
              >
                <mat-icon class="text-sm">download</mat-icon>
                <span class="hidden sm:inline">Download Headshot</span>
              </button>

              <button
                type="button"
                id="compare-close-btn"
                (click)="service.closeCompareModal()"
                class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
          </div>

          <!-- Slider Container -->
          <div class="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center overflow-hidden">
            <div
              #sliderContainer
              id="slider-container"
              (mousedown)="startDrag($event)"
              (touchstart)="startTouchDrag($event)"
              class="relative w-full max-w-xl aspect-square rounded-2xl overflow-hidden shadow-2xl select-none cursor-ew-resize border border-slate-800 bg-slate-950"
            >
              <!-- AFTER IMAGE (Studio Headshot - Full width under layer) -->
              <img
                [src]="headshot.imageUrl"
                alt="After Studio Headshot"
                class="absolute inset-0 w-full h-full object-cover pointer-events-none"
                referrerpolicy="no-referrer"
              />
              <div class="absolute bottom-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-950/80 text-amber-300 backdrop-blur-md border border-amber-500/30">
                AFTER • {{ headshot.styleName }}
              </div>

              <!-- BEFORE IMAGE (Reference Selfie - Clipped top layer) -->
              <div
                class="absolute inset-0 overflow-hidden pointer-events-none border-r-2 border-amber-400"
                [style.width.%]="sliderPosition()"
              >
                <img
                  [src]="headshot.originalReferenceUrl || service.uploadedPhotos()[0]?.dataUrl"
                  alt="Before Reference Selfie"
                  class="absolute inset-0 w-full h-full object-cover max-w-none"
                  [style.width.px]="containerWidth()"
                  [style.height.px]="containerHeight()"
                  referrerpolicy="no-referrer"
                />
                <div class="absolute bottom-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-950/80 text-slate-300 backdrop-blur-md border border-slate-700">
                  BEFORE • Reference Selfie
                </div>
              </div>

              <!-- Draggable Divider Bar with Circular Handle -->
              <div
                class="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none"
                [style.left.%]="sliderPosition()"
              >
                <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl ring-4 ring-amber-400/20">
                  <mat-icon class="text-base font-bold">code</mat-icon>
                </div>
              </div>
            </div>

            <!-- Helper caption & keyboard slider control -->
            <div class="mt-4 flex items-center justify-between w-full max-w-xl text-xs text-slate-400">
              <span class="flex items-center gap-1">
                <mat-icon class="text-sm text-amber-400">touch_app</mat-icon>
                Drag slider or use range
              </span>

              <input
                type="range"
                min="0"
                max="100"
                [value]="sliderPosition()"
                (input)="onRangeInput($event)"
                class="w-36 accent-amber-400 cursor-pointer"
              />

              <span class="font-mono text-slate-300">{{ sliderPosition() }}%</span>
            </div>
          </div>

          <!-- Bottom Biometric Fidelity Breakdown -->
          <div class="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-around gap-4">
            <div class="flex items-center gap-1.5 text-emerald-400">
              <mat-icon class="text-sm">verified</mat-icon>
              <span>Facial Bone Geometry Preserved</span>
            </div>
            <div class="flex items-center gap-1.5 text-blue-400">
              <mat-icon class="text-sm">palette</mat-icon>
              <span>True-to-Life Skin Tone Matching</span>
            </div>
            <div class="flex items-center gap-1.5 text-amber-400">
              <mat-icon class="text-sm">auto_fix_high</mat-icon>
              <span>Studio 85mm Optical Bokeh Applied</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ComparisonSliderComponent {
  readonly service = inject(HeadshotService);
  readonly item = computed(() => this.service.activeCompareItem());
  readonly sliderPosition = signal<number>(50);

  @ViewChild('sliderContainer') containerRef!: ElementRef<HTMLDivElement>;

  readonly containerWidth = signal<number>(500);
  readonly containerHeight = signal<number>(500);

  onRangeInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.sliderPosition.set(Number(target.value));
  }

  startDrag(e: MouseEvent): void {
    this.updatePositionFromMouse(e);
    const onMove = (moveEvent: MouseEvent) => {
      this.updatePositionFromMouse(moveEvent);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  startTouchDrag(e: TouchEvent): void {
    if (e.touches.length) {
      this.updatePositionFromTouch(e.touches[0]);
    }
    const onTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length) {
        this.updatePositionFromTouch(moveEvent.touches[0]);
      }
    };
    const onTouchEnd = () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  }

  private updatePositionFromMouse(e: MouseEvent): void {
    if (!this.containerRef?.nativeElement) return;
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    this.containerWidth.set(rect.width);
    this.containerHeight.set(rect.height);
    const x = e.clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    this.sliderPosition.set(Math.round(pos));
  }

  private updatePositionFromTouch(touch: Touch): void {
    if (!this.containerRef?.nativeElement) return;
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    this.containerWidth.set(rect.width);
    this.containerHeight.set(rect.height);
    const x = touch.clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    this.sliderPosition.set(Math.round(pos));
  }
}
