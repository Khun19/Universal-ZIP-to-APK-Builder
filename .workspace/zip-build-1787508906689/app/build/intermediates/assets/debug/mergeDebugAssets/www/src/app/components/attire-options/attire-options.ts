import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {HeadshotService} from '../../services/headshot.service';
import {
  ATTIRE_OPTIONS,
  EXPRESSION_OPTIONS,
  FRAMING_OPTIONS,
  buildHeadshotPrompt,
} from '../../services/prompt-builder';

@Component({
  selector: 'app-attire-options',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      
      <!-- Header -->
      <div class="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <mat-icon class="text-sm leading-none">tune</mat-icon>
          <span>Step 3 of 4 • Wardrobe & Composition</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          Customize Wardrobe & Framing
        </h1>
        <p class="text-base sm:text-lg text-slate-300">
          Tailor clothing textures, facial expressions, and camera distance to align with your corporate or creative brand.
        </p>
      </div>

      <div class="space-y-8">
        
        <!-- 1. Gender Presentation Toggle -->
        <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <mat-icon class="text-amber-400 text-lg">wc</mat-icon>
                <span>Clothing Fit & Style Alignment</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Guides lapel cut, blouse/shirt drape, and collar structure suggestions.</p>
            </div>

            <!-- Segmented Control -->
            <div class="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
              <button
                type="button"
                id="gender-masculine-btn"
                (click)="service.gender.set('masculine')"
                class="px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                [class.bg-amber-400]="service.gender() === 'masculine'"
                [class.text-slate-950]="service.gender() === 'masculine'"
                [class.text-slate-400]="service.gender() !== 'masculine'"
              >
                <mat-icon class="text-sm">male</mat-icon>
                <span>Masculine</span>
              </button>

              <button
                type="button"
                id="gender-feminine-btn"
                (click)="service.gender.set('feminine')"
                class="px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                [class.bg-amber-400]="service.gender() === 'feminine'"
                [class.text-slate-950]="service.gender() === 'feminine'"
                [class.text-slate-400]="service.gender() !== 'feminine'"
              >
                <mat-icon class="text-sm">female</mat-icon>
                <span>Feminine</span>
              </button>

              <button
                type="button"
                id="gender-neutral-btn"
                (click)="service.gender.set('neutral')"
                class="px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                [class.bg-amber-400]="service.gender() === 'neutral'"
                [class.text-slate-950]="service.gender() === 'neutral'"
                [class.text-slate-400]="service.gender() !== 'neutral'"
              >
                <mat-icon class="text-sm">transgender</mat-icon>
                <span>Neutral</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Attire Type Cards -->
        <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div class="mb-4">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <mat-icon class="text-amber-400 text-lg">checkroom</mat-icon>
              <span>Attire & Tailoring</span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Select the wardrobe style for your AI headshot synthesis.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (attireItem of attireOptions; track attireItem.id) {
              <button
                type="button"
                [id]="'attire-card-' + attireItem.id"
                (click)="service.attire.set(attireItem.id)"
                class="p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between text-left"
                [class.bg-slate-800]="service.attire() === attireItem.id"
                [class.border-amber-400]="service.attire() === attireItem.id"
                [class.shadow-md]="service.attire() === attireItem.id"
                [class.bg-slate-950/60]="service.attire() !== attireItem.id"
                [class.border-slate-800]="service.attire() !== attireItem.id"
                [class.hover:border-slate-700]="service.attire() !== attireItem.id"
              >
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-bold text-white">{{ attireItem.label }}</span>
                    @if (service.attire() === attireItem.id) {
                      <mat-icon class="text-amber-400 text-sm">check_circle</mat-icon>
                    }
                  </div>
                  <p class="text-xs text-slate-400 leading-relaxed mb-3">
                    {{ attireItem.description }}
                  </p>
                </div>

                <div class="text-[11px] p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800/80 font-mono line-clamp-2 w-full">
                  {{ attireItem.genderVariants[service.gender()] || attireItem.genderVariants['neutral'] }}
                </div>
              </button>
            }
          </div>
        </div>

        <!-- 3. Framing & Composition -->
        <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div class="mb-4">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <mat-icon class="text-amber-400 text-lg">crop</mat-icon>
              <span>Framing & Camera Distance</span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Select how close the virtual 85mm f/1.4 lens will frame your portrait.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            @for (frame of framingOptions; track frame.id) {
              <button
                type="button"
                [id]="'framing-card-' + frame.id"
                (click)="service.framing.set(frame.id)"
                class="p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left"
                [class.bg-slate-800]="service.framing() === frame.id"
                [class.border-amber-400]="service.framing() === frame.id"
                [class.bg-slate-950/60]="service.framing() !== frame.id"
                [class.border-slate-800]="service.framing() !== frame.id"
                [class.hover:border-slate-700]="service.framing() !== frame.id"
              >
                <div class="flex items-center gap-2 mb-2">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    [class.bg-amber-400]="service.framing() === frame.id"
                    [class.text-slate-950]="service.framing() === frame.id"
                    [class.bg-slate-800]="service.framing() !== frame.id"
                    [class.text-slate-400]="service.framing() !== frame.id"
                  >
                    <mat-icon class="text-base">{{ frame.icon }}</mat-icon>
                  </div>
                  <span class="text-sm font-bold text-white">{{ frame.label }}</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">
                  {{ frame.description }}
                </p>
              </button>
            }
          </div>
        </div>

        <!-- 4. Facial Expression -->
        <div class="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div class="mb-4">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <mat-icon class="text-amber-400 text-lg">mood</mat-icon>
              <span>Facial Expression & Presence</span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Define your signature micro-expression and gaze.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            @for (exp of expressionOptions; track exp.id) {
              <button
                type="button"
                [id]="'expression-btn-' + exp.id"
                (click)="service.expression.set(exp.id)"
                class="p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer"
                [class.bg-slate-800]="service.expression() === exp.id"
                [class.border-amber-400]="service.expression() === exp.id"
                [class.text-white]="service.expression() === exp.id"
                [class.bg-slate-950/60]="service.expression() !== exp.id"
                [class.border-slate-800]="service.expression() !== exp.id"
                [class.text-slate-300]="service.expression() !== exp.id"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold">{{ exp.label }}</span>
                  @if (service.expression() === exp.id) {
                    <mat-icon class="text-amber-400 text-xs">check_circle</mat-icon>
                  }
                </div>
                <p class="text-[11px] text-slate-400 line-clamp-2">{{ exp.description }}</p>
              </button>
            }
          </div>
        </div>

        <!-- 5. Live Studio Prompt Inspector (Collapsible) -->
        <div class="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          <button
            type="button"
            (click)="showPromptInspector.set(!showPromptInspector())"
            class="w-full flex items-center justify-between text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <div class="flex items-center gap-2 font-medium">
              <mat-icon class="text-amber-400 text-sm">terminal</mat-icon>
              <span>View Assembled Synthesis Prompt & Identity Preservation Rules</span>
            </div>
            <mat-icon class="text-sm transition-transform" [class.rotate-180]="showPromptInspector()">
              expand_more
            </mat-icon>
          </button>

          @if (showPromptInspector()) {
            <div class="mt-3 pt-3 border-t border-slate-800/80 space-y-3 font-mono text-[11px]">
              <div>
                <span class="text-amber-400 font-bold uppercase tracking-wider block mb-1">Active Positive Prompt:</span>
                <p class="text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed whitespace-pre-wrap">
                  {{ activeCompiledPrompt().prompt }}
                </p>
              </div>
              <div>
                <span class="text-rose-400 font-bold uppercase tracking-wider block mb-1">Negative Constraint Filter:</span>
                <p class="text-slate-400 bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {{ activeCompiledPrompt().negativePrompt }}
                </p>
              </div>
            </div>
          }
        </div>

      </div>

      <!-- Action Navigation Bar -->
      <div class="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          id="back-to-styles-btn"
          (click)="service.setStep('style')"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
        >
          <mat-icon class="text-base">arrow_back</mat-icon>
          <span>Back to Styles</span>
        </button>

        <button
          type="button"
          id="start-generation-btn"
          (click)="service.startGeneration()"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-base text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 cursor-pointer"
        >
          <mat-icon class="text-lg">camera_enhance</mat-icon>
          <span>Generate {{ totalVariationsToGenerate() }} Studio Headshots</span>
        </button>
      </div>

    </div>
  `,
})
export class AttireOptionsComponent {
  readonly service = inject(HeadshotService);
  readonly attireOptions = ATTIRE_OPTIONS;
  readonly framingOptions = FRAMING_OPTIONS;
  readonly expressionOptions = EXPRESSION_OPTIONS;
  readonly showPromptInspector = signal<boolean>(false);

  readonly totalVariationsToGenerate = computed(() => {
    return this.service.selectedStyles().length * 4;
  });

  readonly activeCompiledPrompt = computed(() => {
    const firstStyleId = this.service.selectedStyles()[0] || 'corporate_grey';
    return buildHeadshotPrompt({
      styleId: firstStyleId,
      gender: this.service.gender(),
      attire: this.service.attire(),
      framing: this.service.framing(),
      expression: this.service.expression(),
    });
  });
}
