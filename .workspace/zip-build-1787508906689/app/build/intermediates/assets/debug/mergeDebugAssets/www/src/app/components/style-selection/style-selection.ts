import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {HeadshotService} from '../../services/headshot.service';
import {HEADSHOT_STYLES} from '../../services/prompt-builder';
import {StyleOption} from '../../models/headshot.models';

@Component({
  selector: 'app-style-selection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      
      <!-- Header -->
      <div class="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <mat-icon class="text-sm leading-none">auto_awesome</mat-icon>
          <span>Step 2 of 4 • Lighting & Environment</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          Select Your Portrait Backdrops
        </h1>
        <p class="text-base sm:text-lg text-slate-300">
          Choose one or multiple signature studio environments. We generate 4 high-resolution portrait variations per style in a single batch.
        </p>
      </div>

      <!-- Quick Selection Helpers -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800">
        <div class="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
          <mat-icon class="text-amber-400 text-base">style</mat-icon>
          <span>
            Selected: <strong class="text-white">{{ service.selectedStyles().length }}</strong> style{{ service.selectedStyles().length === 1 ? '' : 's' }} 
            ({{ service.selectedStyles().length * 4 }} total headshot variations)
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            id="select-popular-styles-btn"
            (click)="selectPopular()"
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            Popular Bundle (3)
          </button>
          <button
            type="button"
            id="select-all-styles-btn"
            (click)="service.selectAllStyles()"
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors cursor-pointer"
          >
            Select All ({{ allStyles.length }})
          </button>
        </div>
      </div>

      <!-- Style Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (style of allStyles; track style.id) {
          <button
            type="button"
            [id]="'style-card-' + style.id"
            (click)="service.toggleStyle(style.id)"
            class="group relative rounded-3xl overflow-hidden bg-slate-900 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between text-left p-0"
            [class.border-amber-400]="isSelected(style.id)"
            [class.shadow-xl]="isSelected(style.id)"
            [class.shadow-amber-500/10]="isSelected(style.id)"
            [class.border-slate-800]="!isSelected(style.id)"
            [class.hover:border-slate-600]="!isSelected(style.id)"
          >
            <!-- Image & Lighting Badge -->
            <div class="relative aspect-4/3 w-full bg-slate-950 overflow-hidden">
              <img
                [src]="style.previewUrl"
                [alt]="style.name"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerpolicy="no-referrer"
              />
              
              <!-- Gradient Overlay for text contrast -->
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30"></div>

              <!-- Top Lighting badge & category -->
              <div class="absolute top-3 left-3 flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-950/80 backdrop-blur-md text-slate-200 border border-slate-700">
                  {{ style.category }}
                </span>
                @if (style.isPopular) {
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                    Popular
                  </span>
                }
              </div>

              <!-- Selection Checkbox in Top-Right -->
              <div
                class="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md"
                [class.bg-amber-400]="isSelected(style.id)"
                [class.text-slate-950]="isSelected(style.id)"
                [class.bg-slate-950/70]="!isSelected(style.id)"
                [class.text-slate-400]="!isSelected(style.id)"
                [class.border]="!isSelected(style.id)"
                [class.border-slate-600]="!isSelected(style.id)"
              >
                @if (isSelected(style.id)) {
                  <mat-icon class="text-base font-bold">check</mat-icon>
                }
              </div>

              <!-- Lighting Vector Indicator -->
              <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300">
                <span class="flex items-center gap-1 text-[11px] bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur">
                  <mat-icon class="text-amber-400 text-xs">wb_incandescent</mat-icon>
                  {{ style.lightingBadge }}
                </span>
                <span class="text-[11px] text-amber-300 font-medium">
                  4 Variations
                </span>
              </div>
            </div>

            <!-- Content Area -->
            <div class="p-5 flex-1 flex flex-col justify-between w-full">
              <div>
                <h3 class="text-lg font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                  {{ style.name }}
                </h3>
                <p class="text-xs font-medium text-amber-400/90 mb-2">
                  {{ style.tagline }}
                </p>
                <p class="text-xs text-slate-400 leading-relaxed">
                  {{ style.description }}
                </p>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span class="text-[11px] text-slate-400">
                  {{ isSelected(style.id) ? 'Selected for generation' : 'Click to select' }}
                </span>
                <span
                  class="text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
                  [class.bg-amber-400]="isSelected(style.id)"
                  [class.text-slate-950]="isSelected(style.id)"
                  [class.bg-slate-800]="!isSelected(style.id)"
                  [class.text-slate-300]="!isSelected(style.id)"
                >
                  {{ isSelected(style.id) ? 'Included' : '+ Add Style' }}
                </span>
              </div>
            </div>
          </button>
        }
      </div>

      <!-- Action Navigation Bar -->
      <div class="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          id="back-to-upload-btn"
          (click)="service.setStep('upload')"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
        >
          <mat-icon class="text-base">arrow_back</mat-icon>
          <span>Back to Photos</span>
        </button>

        <button
          type="button"
          id="proceed-to-attire-btn"
          [disabled]="!service.canProceedFromStyle()"
          (click)="service.setStep('attire')"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          <span>Customize Attire & Framing</span>
          <mat-icon class="text-base">arrow_forward</mat-icon>
        </button>
      </div>

    </div>
  `,
})
export class StyleSelectionComponent {
  readonly service = inject(HeadshotService);
  readonly allStyles: StyleOption[] = HEADSHOT_STYLES;

  isSelected(styleId: string): boolean {
    return this.service.selectedStyles().includes(styleId);
  }

  selectPopular(): void {
    this.service.selectedStyles.set(['corporate_grey', 'modern_tech_office', 'outdoor_natural']);
  }
}
