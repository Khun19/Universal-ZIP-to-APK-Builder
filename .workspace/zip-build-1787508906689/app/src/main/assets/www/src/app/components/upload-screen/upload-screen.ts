import {ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {HeadshotService} from '../../services/headshot.service';

@Component({
  selector: 'app-upload-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      
      <!-- Top Title & Value Proposition -->
      <div class="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <mat-icon class="text-sm leading-none">verified_user</mat-icon>
          <span>Step 1 of 4 • Identity Calibration</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          Upload 3–5 Casual Selfies
        </h1>
        <p class="text-base sm:text-lg text-slate-300">
          Our AI analyzes your unique facial geometry, skin tone, and bone structure to preserve your true likeness across executive studio lighting setups.
        </p>
      </div>

      <!-- Quick Preset Testing Banner -->
      <div class="mb-8 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
            <mat-icon>flash_on</mat-icon>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-white">Don't have 3 selfies ready on this device?</h2>
            <p class="text-xs text-slate-400">Load our curated diverse studio sample datasets for an instant 1-click test drive.</p>
          </div>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            id="load-sample-female-btn"
            (click)="service.loadSamplePreset('female')"
            [disabled]="service.isValidatingPhotos()"
            class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <mat-icon class="text-sm">face_3</mat-icon>
            <span>Female Sample</span>
          </button>
          <button
            type="button"
            id="load-sample-male-btn"
            (click)="service.loadSamplePreset('male')"
            [disabled]="service.isValidatingPhotos()"
            class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <mat-icon class="text-sm">face_6</mat-icon>
            <span>Male Sample</span>
          </button>
        </div>
      </div>

      <!-- Drag & Drop Upload Zone -->
      <div
        id="photo-dropzone"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
        role="button"
        tabindex="0"
        (keydown.enter)="fileInput.click()"
        class="relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        [class.border-amber-400]="isDragging()"
        [class.bg-amber-500/5]="isDragging()"
        [class.border-slate-700]="!isDragging()"
        [class.hover:border-slate-500]="!isDragging()"
        [class.bg-slate-900/50]="!isDragging()"
      >
        <input
          #fileInput
          id="photo-file-input"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          multiple
          (change)="onFileSelected($event)"
          class="hidden"
        />

        <div class="max-w-md mx-auto space-y-4">
          <div class="w-16 h-16 mx-auto rounded-2xl bg-slate-800 border border-slate-700 group-hover:border-amber-400/50 flex items-center justify-center text-amber-400 shadow-md transition-all group-hover:scale-105">
            <mat-icon class="text-3xl">add_photo_alternate</mat-icon>
          </div>
          
          <div>
            <h2 class="text-lg font-semibold text-white mb-1">
              Drag and drop your selfies here, or <span class="text-amber-400 underline underline-offset-4">browse files</span>
            </h2>
            <p class="text-xs sm:text-sm text-slate-400">
              Supports JPEG, PNG, or WebP. Optimal results with clear frontal angles and natural lighting.
            </p>
          </div>

          <div class="inline-flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span class="flex items-center gap-1"><mat-icon class="text-emerald-400 text-sm">check_circle</mat-icon> Frontal face angle</span>
            <span class="flex items-center gap-1"><mat-icon class="text-emerald-400 text-sm">check_circle</mat-icon> Good lighting</span>
            <span class="flex items-center gap-1"><mat-icon class="text-rose-400 text-sm">cancel</mat-icon> No sunglasses/hats</span>
          </div>
        </div>

        @if (service.isValidatingPhotos()) {
          <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-3 z-10">
            <div class="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-medium text-amber-300">Analyzing facial geometry with Gemini Vision...</p>
          </div>
        }
      </div>

      <!-- Uploaded Photo Cards Grid -->
      @if (service.uploadedPhotos().length > 0) {
        <div class="mt-10">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <h2 class="text-base font-semibold text-white">Your Calibration Photos</h2>
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                [class.bg-emerald-500/20]="service.validPhotosCount() >= 3"
                [class.text-emerald-300]="service.validPhotosCount() >= 3"
                [class.border]="service.validPhotosCount() >= 3"
                [class.border-emerald-500/30]="service.validPhotosCount() >= 3"
                [class.bg-amber-500/20]="service.validPhotosCount() < 3"
                [class.text-amber-300]="service.validPhotosCount() < 3"
                [class.border-amber-500/30]="service.validPhotosCount() < 3"
              >
                {{ service.validPhotosCount() }} of 5 Verified (Min 3 required)
              </span>
            </div>

            <button
              type="button"
              id="clear-all-photos-btn"
              (click)="service.clearAllPhotos()"
              class="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <mat-icon class="text-sm">delete_outline</mat-icon>
              <span>Clear All</span>
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            @for (photo of service.uploadedPhotos(); track photo.id; let idx = $index) {
              <div
                [id]="'photo-card-' + photo.id"
                class="group relative rounded-2xl overflow-hidden bg-slate-900 border transition-all duration-200"
                [class.border-emerald-500/50]="photo.validationStatus === 'valid'"
                [class.border-amber-500/50]="photo.validationStatus === 'warning'"
                [class.border-rose-500/50]="photo.validationStatus === 'error'"
                [class.border-slate-800]="photo.validationStatus === 'checking'"
              >
                <!-- Aspect Ratio Container -->
                <div class="aspect-square w-full relative bg-slate-950">
                  <img
                    [src]="photo.dataUrl"
                    [alt]="photo.name"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer"
                  />

                  <!-- Overlay Badge on Status -->
                  <div class="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold backdrop-blur-md shadow"
                    [class.bg-emerald-950/80]="photo.validationStatus === 'valid'"
                    [class.text-emerald-300]="photo.validationStatus === 'valid'"
                    [class.border]="photo.validationStatus === 'valid'"
                    [class.border-emerald-500/40]="photo.validationStatus === 'valid'"
                    [class.bg-amber-950/80]="photo.validationStatus === 'warning'"
                    [class.text-amber-300]="photo.validationStatus === 'warning'"
                    [class.bg-rose-950/80]="photo.validationStatus === 'error'"
                    [class.text-rose-300]="photo.validationStatus === 'error'"
                    [class.bg-slate-900/80]="photo.validationStatus === 'checking'"
                    [class.text-slate-300]="photo.validationStatus === 'checking'"
                  >
                    @if (photo.validationStatus === 'valid') {
                      <mat-icon class="text-xs font-bold leading-none">check_circle</mat-icon>
                      <span>Verified</span>
                    } @else if (photo.validationStatus === 'warning') {
                      <mat-icon class="text-xs leading-none">warning</mat-icon>
                      <span>Low Light</span>
                    } @else if (photo.validationStatus === 'error') {
                      <mat-icon class="text-xs leading-none">error</mat-icon>
                      <span>No Face</span>
                    } @else {
                      <mat-icon class="text-xs animate-spin leading-none">sync</mat-icon>
                      <span>Checking</span>
                    }
                  </div>

                  <!-- Remove Button -->
                  <button
                    type="button"
                    [id]="'remove-photo-' + photo.id"
                    (click)="service.removePhoto(photo.id)"
                    title="Remove photo"
                    class="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-950/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors opacity-90 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <mat-icon class="text-sm">close</mat-icon>
                  </button>
                </div>

                <!-- Info footer -->
                <div class="p-2.5 bg-slate-900 text-xs">
                  <p class="text-slate-200 font-medium truncate" [title]="photo.name">{{ photo.name }}</p>
                  @if (photo.validationResult?.feedback) {
                    <p class="text-[11px] text-slate-400 truncate mt-0.5" [title]="photo.validationResult?.feedback">
                      {{ photo.validationResult?.feedback }}
                    </p>
                  }
                </div>
              </div>
            }

            <!-- Add More Placeholder Slot if < 5 -->
            @if (service.uploadedPhotos().length < 5) {
              <button
                type="button"
                id="add-more-photos-slot"
                (click)="fileInput.click()"
                class="border-2 border-dashed border-slate-800 hover:border-slate-600 rounded-2xl aspect-square flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-amber-400 transition-colors p-4 group cursor-pointer"
              >
                <div class="w-10 h-10 rounded-xl bg-slate-800/80 group-hover:bg-slate-700 flex items-center justify-center transition-colors">
                  <mat-icon class="text-xl">add</mat-icon>
                </div>
                <span class="text-xs font-medium">Add Photo ({{ service.uploadedPhotos().length }}/5)</span>
              </button>
            }
          </div>
        </div>
      }

      <!-- Bottom Guidance / Best Practices -->
      <div class="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <mat-icon class="text-lg">wb_sunny</mat-icon>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-white">Consistent Natural Light</h2>
            <p class="text-xs text-slate-400 mt-0.5">Faces facing daylight yield the sharpest eye catchlights and skin tones.</p>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <mat-icon class="text-lg">face</mat-icon>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-white">Multiple Angles</h2>
            <p class="text-xs text-slate-400 mt-0.5">Mix straight-on and slight three-quarter view angles for 3D depth calibration.</p>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <mat-icon class="text-lg">lock</mat-icon>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-white">Encrypted & Auto-Purged</h2>
            <p class="text-xs text-slate-400 mt-0.5">Files are never shared or sold. Purged within 24h or immediately upon request.</p>
          </div>
        </div>
      </div>

      <!-- Action Navigation Bar -->
      <div class="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <mat-icon class="text-sm text-slate-400">info</mat-icon>
          <span>Minimum 3 verified selfies required to calibrate headshot AI.</span>
        </div>

        <button
          type="button"
          id="proceed-to-styles-btn"
          [disabled]="!service.canProceedFromUpload()"
          (click)="proceedToStyles()"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 cursor-pointer"
        >
          <span>Continue to Style Selection</span>
          <mat-icon class="text-base">arrow_forward</mat-icon>
        </button>
      </div>

    </div>
  `,
})
export class UploadScreenComponent {
  readonly service = inject(HeadshotService);
  readonly isDragging = signal<boolean>(false);

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
    if (e.dataTransfer?.files?.length) {
      this.service.addFiles(e.dataTransfer.files);
    }
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      this.service.addFiles(input.files);
      input.value = '';
    }
  }

  proceedToStyles(): void {
    if (this.service.canProceedFromUpload()) {
      this.service.setStep('style');
    }
  }
}
