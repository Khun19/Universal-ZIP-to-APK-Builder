import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {HeadshotService} from '../../services/headshot.service';
import {HEADSHOT_STYLES} from '../../services/prompt-builder';

@Component({
  selector: 'app-results-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      
      <!-- Top Success Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <mat-icon class="text-sm leading-none">task_alt</mat-icon>
            <span>Masterclass Portraits Complete</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            Your Studio Headshots
          </h1>
          <p class="text-sm sm:text-base text-slate-300">
            Generated with calibrated facial geometry, 85mm f/1.4 depth of field, and studio lighting setups.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            id="generate-more-variations-btn"
            (click)="service.setStep('style')"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <mat-icon class="text-base">tune</mat-icon>
            <span>Generate More Styles</span>
          </button>

          <button
            type="button"
            id="download-all-headshots-btn"
            (click)="downloadAll()"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 shadow-md shadow-amber-500/20 transition-all"
          >
            <mat-icon class="text-base">download</mat-icon>
            <span>Download All ({{ filteredHeadshots().length }})</span>
          </button>
        </div>
      </div>

      <!-- Filter Tabs: All, By Style, Favorites -->
      <div class="flex items-center justify-between gap-4 overflow-x-auto pb-3 mb-8 no-scrollbar">
        <div class="flex items-center gap-2">
          <button
            type="button"
            id="filter-all-btn"
            (click)="activeFilter.set('all')"
            class="px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
            [class.bg-amber-400]="activeFilter() === 'all'"
            [class.text-slate-950]="activeFilter() === 'all'"
            [class.bg-slate-900]="activeFilter() !== 'all'"
            [class.text-slate-300]="activeFilter() !== 'all'"
            [class.border]="activeFilter() !== 'all'"
            [class.border-slate-800]="activeFilter() !== 'all'"
          >
            All Headshots ({{ service.historyResults().length }})
          </button>

          @for (style of activeGeneratedStyles(); track style.id) {
            <button
              type="button"
              [id]="'filter-style-btn-' + style.id"
              (click)="activeFilter.set(style.id)"
              class="px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
              [class.bg-amber-400]="activeFilter() === style.id"
              [class.text-slate-950]="activeFilter() === style.id"
              [class.bg-slate-900]="activeFilter() !== style.id"
              [class.text-slate-300]="activeFilter() !== style.id"
              [class.border]="activeFilter() !== style.id"
              [class.border-slate-800]="activeFilter() !== style.id"
            >
              {{ style.name }} ({{ countForStyle(style.id) }})
            </button>
          }

          <button
            type="button"
            id="filter-favorites-btn"
            (click)="activeFilter.set('favorites')"
            class="px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5"
            [class.bg-amber-400]="activeFilter() === 'favorites'"
            [class.text-slate-950]="activeFilter() === 'favorites'"
            [class.bg-slate-900]="activeFilter() !== 'favorites'"
            [class.text-amber-400]="activeFilter() !== 'favorites'"
            [class.border]="activeFilter() !== 'favorites'"
            [class.border-slate-800]="activeFilter() !== 'favorites'"
          >
            <mat-icon class="text-xs">star</mat-icon>
            <span>Favorites ({{ service.favorites().length }})</span>
          </button>
        </div>

        <div class="hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <mat-icon class="text-xs text-amber-400">compare</mat-icon>
          <span>Tip: Click "Compare" on any photo to see the interactive Before/After split view.</span>
        </div>
      </div>

      <!-- Main Photo Results Grid -->
      @if (filteredHeadshots().length === 0) {
        <div class="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 max-w-md mx-auto my-8">
          <mat-icon class="text-4xl text-slate-600 mb-2">image_not_supported</mat-icon>
          <h2 class="text-base font-bold text-white mb-1">No Headshots Found in This Filter</h2>
          <p class="text-xs text-slate-400 mb-4">You haven't marked any headshots as favorites yet, or none match the selected style.</p>
          <button
            type="button"
            (click)="activeFilter.set('all')"
            class="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700"
          >
            Show All Headshots
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (item of filteredHeadshots(); track item.id; let idx = $index) {
            <div
              [id]="'headshot-card-' + item.id"
              class="group relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all duration-300 shadow-lg flex flex-col justify-between"
            >
              <!-- Image Container -->
              <div
                class="relative aspect-square w-full bg-slate-950 overflow-hidden cursor-pointer"
                role="button"
                tabindex="0"
                (keydown.enter)="service.openLightbox(item)"
                (click)="service.openLightbox(item)"
              >
                <img
                  [src]="item.imageUrl"
                  [alt]="item.styleName + ' Headshot'"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerpolicy="no-referrer"
                />

                <!-- Gradient Overlay on Hover -->
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5">
                  
                  <!-- Top Row inside Hover: Style Badge + Zoom trigger -->
                  <div class="flex items-center justify-between">
                    <span class="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-500/30">
                      {{ item.styleName }}
                    </span>
                    
                    <button
                      type="button"
                      [id]="'lightbox-btn-' + item.id"
                      (click)="$event.stopPropagation(); service.openLightbox(item)"
                      title="Inspect High-Res Portrait"
                      class="w-8 h-8 rounded-full bg-slate-950/80 hover:bg-slate-800 text-white flex items-center justify-center transition-colors"
                    >
                      <mat-icon class="text-sm">zoom_in</mat-icon>
                    </button>
                  </div>

                  <!-- Center Comparison Pill -->
                  <div class="flex justify-center">
                    <button
                      type="button"
                      [id]="'compare-slider-btn-' + item.id"
                      (click)="$event.stopPropagation(); service.openCompareModal(item)"
                      class="px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg hover:bg-amber-300 transition-all hover:scale-105"
                    >
                      <mat-icon class="text-sm">compare</mat-icon>
                      <span>Before / After Split</span>
                    </button>
                  </div>

                  <!-- Bottom Hover Specs -->
                  <div class="text-[11px] text-slate-300 flex items-center justify-between">
                    <span>{{ item.attireLabel }}</span>
                    <span>{{ item.resolution }}</span>
                  </div>
                </div>

                <!-- Favorite Toggle in Top-Right (Always Visible) -->
                <button
                  type="button"
                  [id]="'favorite-btn-' + item.id"
                  (click)="$event.stopPropagation(); service.toggleFavorite(item.id)"
                  title="Bookmark as favorite"
                  class="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md"
                  [class.bg-amber-400]="item.isFavorite"
                  [class.text-slate-950]="item.isFavorite"
                  [class.bg-slate-950/70]="!item.isFavorite"
                  [class.text-slate-300]="!item.isFavorite"
                  [class.hover:text-amber-400]="!item.isFavorite"
                >
                  <mat-icon class="text-base leading-none">{{ item.isFavorite ? 'star' : 'star_border' }}</mat-icon>
                </button>
              </div>

              <!-- Card Action Bar -->
              <div class="p-4 bg-slate-900 flex items-center justify-between gap-2 border-t border-slate-800/80">
                <div>
                  <h2 class="text-xs font-bold text-white truncate">{{ item.styleName }}</h2>
                  <p class="text-[11px] text-slate-400 capitalize">{{ item.attireLabel }} • {{ item.framingLabel }}</p>
                </div>

                <div class="flex items-center gap-1.5">
                  <!-- Regenerate this one -->
                  <button
                    type="button"
                    [id]="'regen-one-btn-' + item.id"
                    (click)="service.regenerateOne(item.id)"
                    title="Regenerate this specific variation"
                    class="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                  >
                    <mat-icon class="text-sm">refresh</mat-icon>
                  </button>

                  <!-- Download Button -->
                  <button
                    type="button"
                    [id]="'download-card-btn-' + item.id"
                    (click)="service.downloadImage(item)"
                    title="Download high-resolution image"
                    class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                  >
                    <mat-icon class="text-sm">download</mat-icon>
                  </button>
                </div>
              </div>

            </div>
          }
        </div>
      }

      <!-- Bottom Session Control Footer -->
      <div class="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          id="upload-new-photos-btn"
          (click)="service.setStep('upload')"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
        >
          <mat-icon class="text-base">add_photo_alternate</mat-icon>
          <span>Upload Different Selfies</span>
        </button>

        <div class="flex items-center gap-3">
          <button
            type="button"
            id="purge-session-results-btn"
            (click)="service.purgeSessionData()"
            class="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
          >
            <mat-icon class="text-sm">delete_forever</mat-icon>
            <span>Delete my photos & results now</span>
          </button>
        </div>
      </div>

    </div>
  `,
})
export class ResultsScreenComponent {
  readonly service = inject(HeadshotService);
  readonly activeFilter = signal<string>('all');

  readonly activeGeneratedStyles = computed(() => {
    const presentStyleIds = new Set(this.service.historyResults().map((r) => r.styleId));
    return HEADSHOT_STYLES.filter((s) => presentStyleIds.has(s.id));
  });

  readonly filteredHeadshots = computed(() => {
    const filter = this.activeFilter();
    const all = this.service.historyResults();
    if (filter === 'all') return all;
    if (filter === 'favorites') return all.filter((item) => item.isFavorite);
    return all.filter((item) => item.styleId === filter);
  });

  countForStyle(styleId: string): number {
    return this.service.historyResults().filter((item) => item.styleId === styleId).length;
  }

  downloadAll(): void {
    const items = this.filteredHeadshots();
    if (items.length === 0) return;
    this.service.showToast(`Initiating batch download for ${items.length} headshots...`, 'info');
    items.forEach((item, idx) => {
      setTimeout(() => {
        this.service.downloadImage(item);
      }, idx * 250);
    });
  }
}
