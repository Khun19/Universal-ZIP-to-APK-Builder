import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {HeadshotService} from '../../services/headshot.service';

@Component({
  selector: 'app-lightbox-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (item(); as headshot) {
      <div
        id="lightbox-modal-backdrop"
        class="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      >
        <!-- Backdrop click surface -->
        <button
          type="button"
          class="fixed inset-0 w-full h-full cursor-default bg-transparent border-0"
          (click)="service.closeLightbox()"
          aria-label="Close modal background"
        ></button>

        <div
          class="relative z-10 w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]"
        >
          <!-- Left: Image Canvas -->
          <div class="relative flex-1 bg-slate-950 flex items-center justify-center p-4 overflow-hidden min-h-[350px] md:min-h-[500px]">
            <img
              [src]="headshot.highResUrl || headshot.imageUrl"
              [alt]="headshot.styleName + ' Portrait'"
              class="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl"
              referrerpolicy="no-referrer"
            />

            <!-- Top Floating Badge -->
            <div class="absolute top-4 left-4 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-950/80 text-amber-300 backdrop-blur-md border border-amber-500/30">
              {{ headshot.styleName }}
            </div>
          </div>

          <!-- Right: Details, Prompt & Metadata Sidebar -->
          <div class="w-full md:w-80 lg:w-96 p-6 bg-slate-900 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 overflow-y-auto">
            <div>
              <!-- Top bar inside sidebar -->
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs uppercase tracking-wider font-bold text-amber-400">Headshot Master</span>
                
                <button
                  type="button"
                  id="lightbox-close-btn"
                  (click)="service.closeLightbox()"
                  class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <mat-icon class="text-sm">close</mat-icon>
                </button>
              </div>

              <h2 class="text-xl font-bold text-white mb-1">{{ headshot.styleName }}</h2>
              <p class="text-xs text-slate-400 mb-6">Master Portrait File (85mm f/1.4 Lens Simulation)</p>

              <!-- Metadata Specs -->
              <div class="space-y-3 mb-6 text-xs">
                <div class="flex justify-between py-2 border-b border-slate-800">
                  <span class="text-slate-400">Attire Selection:</span>
                  <span class="text-slate-200 font-semibold capitalize">{{ headshot.attireLabel }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-slate-800">
                  <span class="text-slate-400">Framing:</span>
                  <span class="text-slate-200 font-semibold capitalize">{{ headshot.framingLabel }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-slate-800">
                  <span class="text-slate-400">Resolution:</span>
                  <span class="text-slate-200 font-semibold">{{ headshot.resolution }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-slate-800">
                  <span class="text-slate-400">Aspect Ratio:</span>
                  <span class="text-slate-200 font-semibold">1:1 Square (LinkedIn Standard)</span>
                </div>
              </div>

              <!-- Prompt Snippet -->
              <div class="mb-6">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-semibold text-slate-300">Generation Prompt</span>
                  <button
                    type="button"
                    (click)="copyPrompt(headshot.promptUsed)"
                    class="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <mat-icon class="text-xs">content_copy</mat-icon>
                    <span>Copy</span>
                  </button>
                </div>
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono line-clamp-4 leading-relaxed">
                  {{ headshot.promptUsed }}
                </div>
              </div>
            </div>

            <!-- Bottom Actions in Sidebar -->
            <div class="space-y-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                id="lightbox-download-btn"
                (click)="service.downloadImage(headshot)"
                class="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <mat-icon class="text-sm">download</mat-icon>
                <span>Download High-Res (PNG)</span>
              </button>

              <button
                type="button"
                id="lightbox-compare-btn"
                (click)="service.openCompareModal(headshot)"
                class="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
              >
                <mat-icon class="text-sm text-amber-400">compare</mat-icon>
                <span>Compare Before & After</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class LightboxModalComponent {
  readonly service = inject(HeadshotService);
  readonly item = computed(() => this.service.activeLightboxItem());

  copyPrompt(text: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.service.showToast('Generation prompt copied to clipboard!', 'info');
    }
  }
}
