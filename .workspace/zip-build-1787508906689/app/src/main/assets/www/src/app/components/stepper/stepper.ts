import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {HeadshotService} from '../../services/headshot.service';

interface StepDef {
  key: 'upload' | 'style' | 'attire' | 'processing' | 'results';
  num: number;
  label: string;
  sublabel: string;
  icon: string;
}

@Component({
  selector: 'app-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <nav aria-label="Progress" class="w-full bg-slate-900/60 border-b border-slate-800 py-3 sm:py-4 px-4">
      <div class="max-w-6xl mx-auto">
        <ol class="flex items-center justify-between gap-2 sm:gap-4">
          @for (step of steps; track step.key; let idx = $index; let isLast = $last) {
            <li class="flex-1 flex items-center gap-2">
              <button
                type="button"
                [id]="'step-nav-btn-' + step.key"
                [disabled]="!canNavigateTo(step.key)"
                (click)="onStepClick(step.key)"
                class="group w-full flex items-center gap-2.5 text-left disabled:cursor-not-allowed focus:outline-none"
              >
                <!-- Step Circle -->
                <div
                  class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0"
                  [class.bg-amber-400]="isCurrent(step.key)"
                  [class.text-slate-950]="isCurrent(step.key)"
                  [class.ring-4]="isCurrent(step.key)"
                  [class.ring-amber-400/20]="isCurrent(step.key)"
                  [class.bg-emerald-500]="isCompleted(step.key)"
                  [class.text-white]="isCompleted(step.key)"
                  [class.bg-slate-800]="isPending(step.key)"
                  [class.text-slate-400]="isPending(step.key)"
                  [class.border]="isPending(step.key)"
                  [class.border-slate-700]="isPending(step.key)"
                >
                  @if (isCompleted(step.key)) {
                    <mat-icon class="text-base font-bold">check</mat-icon>
                  } @else {
                    <mat-icon class="text-base">{{ step.icon }}</mat-icon>
                  }
                </div>

                <!-- Labels -->
                <div class="hidden md:block overflow-hidden">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="text-xs font-semibold uppercase tracking-wider transition-colors"
                      [class.text-amber-400]="isCurrent(step.key)"
                      [class.text-slate-200]="isCompleted(step.key)"
                      [class.text-slate-400]="isPending(step.key)"
                    >
                      Step {{ step.num }}
                    </span>
                  </div>
                  <p
                    class="text-xs sm:text-sm font-medium truncate"
                    [class.text-white]="isCurrent(step.key) || isCompleted(step.key)"
                    [class.text-slate-400]="isPending(step.key)"
                  >
                    {{ step.label }}
                  </p>
                </div>
              </button>

              <!-- Connector Line -->
              @if (!isLast) {
                <div
                  class="hidden sm:block h-0.5 w-4 sm:w-8 lg:w-12 transition-colors duration-200"
                  [class.bg-emerald-500]="isCompleted(step.key)"
                  [class.bg-amber-400/50]="isCurrent(step.key)"
                  [class.bg-slate-800]="isPending(step.key)"
                ></div>
              }
            </li>
          }
        </ol>
      </div>
    </nav>
  `,
})
export class StepperComponent {
  readonly service = inject(HeadshotService);

  readonly steps: StepDef[] = [
    {key: 'upload', num: 1, label: 'Upload Selfies', sublabel: '3–5 Casual Photos', icon: 'file_upload'},
    {key: 'style', num: 2, label: 'Choose Styles', sublabel: 'Backdrop & Lighting', icon: 'photo_size_select_actual'},
    {key: 'attire', num: 3, label: 'Attire & Framing', sublabel: 'Suit & Composition', icon: 'checkroom'},
    {key: 'processing', num: 4, label: 'Studio Synthesis', sublabel: 'Identity Preservation', icon: 'hourglass_top'},
    {key: 'results', num: 5, label: 'Headshots Gallery', sublabel: 'Masterclass Portraits', icon: 'collections'},
  ];

  isCurrent(stepKey: StepDef['key']): boolean {
    return this.service.currentStep() === stepKey;
  }

  isCompleted(stepKey: StepDef['key']): boolean {
    const current = this.service.currentStep();
    const order = ['upload', 'style', 'attire', 'processing', 'results'];
    return order.indexOf(current) > order.indexOf(stepKey);
  }

  isPending(stepKey: StepDef['key']): boolean {
    const current = this.service.currentStep();
    const order = ['upload', 'style', 'attire', 'processing', 'results'];
    return order.indexOf(current) < order.indexOf(stepKey);
  }

  canNavigateTo(stepKey: StepDef['key']): boolean {
    if (this.service.currentStep() === 'processing') return false;
    if (stepKey === 'upload') return true;
    if (stepKey === 'style') return this.service.validPhotosCount() >= 3;
    if (stepKey === 'attire') return this.service.validPhotosCount() >= 3 && this.service.selectedStyles().length > 0;
    if (stepKey === 'results') return this.service.historyResults().length > 0;
    return false;
  }

  onStepClick(stepKey: StepDef['key']): void {
    if (this.canNavigateTo(stepKey)) {
      this.service.setStep(stepKey);
    }
  }
}
