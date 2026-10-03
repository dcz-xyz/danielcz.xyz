/**
 * <moire-explorer>: two line gratings drawn on a canvas. The bottom grating is
 * fixed; sliders set the top grating's pitch, rotation and shift. The readout
 * gives the resulting beat (moiré) period and how much a shift of the top
 * layer is amplified: the principle behind MoiréWidgets.
 *
 * Loaded lazily by Demo.astro when the element scrolls near the viewport.
 * No framework: ~3 KB gzipped. Keyboard works through the native sliders.
 */

const BASE_PITCH = 12; // px, bottom grating
const DUTY = 0.5; // ink fraction of each period
const ASPECT = 0.5; // canvas height / width
const ANIMATION_PERIOD_MS = 6000;

interface Params {
  pitch: number;
  angle: number;
  shift: number;
}

const DEFAULTS: Params = { pitch: 12.5, angle: 0, shift: 0 };

interface SliderSpec {
  key: keyof Params;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SLIDERS: SliderSpec[] = [
  { key: 'pitch', label: 'Top layer pitch', min: 10, max: 14, step: 0.1, unit: 'px' },
  { key: 'angle', label: 'Top layer rotation', min: -8, max: 8, step: 0.1, unit: '°' },
  { key: 'shift', label: 'Top layer shift', min: -12, max: 12, step: 0.1, unit: 'px' },
];

/** Moiré period of two gratings with pitches p1, p2 at an angle (degrees). */
export function beatPeriod(p1: number, p2: number, degrees: number): number {
  const t = (degrees * Math.PI) / 180;
  const d = Math.sqrt(p1 * p1 + p2 * p2 - 2 * p1 * p2 * Math.cos(t));
  return d < 1e-6 ? Infinity : (p1 * p2) / d;
}

const fmt = (n: number, digits = 1) => n.toFixed(digits).replace(/\.0$/, '');

export class MoireExplorer extends HTMLElement {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private params: Params = { ...DEFAULTS };
  private inputs = new Map<keyof Params, HTMLInputElement>();
  private outputs = new Map<keyof Params, HTMLOutputElement>();
  private readout!: HTMLElement;
  private animateBox!: HTMLInputElement;
  private observer?: ResizeObserver;
  private frame = 0;
  private start = 0;
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  connectedCallback() {
    if (this.dataset.ready) return;
    this.build();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this);
    this.resize();
    this.dataset.ready = 'true';
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    cancelAnimationFrame(this.frame);
  }

  private build() {
    const fallback = this.querySelector<HTMLElement>('[data-fallback]');
    if (fallback) fallback.hidden = true;

    const ui = document.createElement('div');
    ui.className = 'moire';

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'moire__canvas';
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Preview of the two overlapping gratings');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    ui.append(this.canvas);

    const controls = document.createElement('div');
    controls.className = 'moire__controls';
    for (const spec of SLIDERS) controls.append(this.buildSlider(spec));

    const toggle = document.createElement('label');
    toggle.className = 'moire__toggle';
    this.animateBox = document.createElement('input');
    this.animateBox.type = 'checkbox';
    this.animateBox.addEventListener('change', () => this.setAnimating(this.animateBox.checked));
    toggle.append(this.animateBox, ' Animate the shift');
    if (this.reducedMotion) {
      this.animateBox.disabled = true;
      toggle.title = 'Animation is off because your system prefers reduced motion';
      toggle.append(document.createTextNode(' (off: reduced motion)'));
    }

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'moire__reset';
    reset.textContent = 'Reset';
    reset.addEventListener('click', () => this.reset());

    const actions = document.createElement('div');
    actions.className = 'moire__actions';
    actions.append(toggle, reset);
    controls.append(actions);
    ui.append(controls);

    this.readout = document.createElement('p');
    this.readout.className = 'moire__readout';
    this.readout.dataset.readout = '';
    this.readout.setAttribute('aria-live', 'polite');
    ui.append(this.readout);

    this.append(ui);
    this.updateReadout();
  }

  private buildSlider(spec: SliderSpec) {
    const field = document.createElement('label');
    field.className = 'moire__field';
    const name = document.createElement('span');
    name.className = 'moire__label';
    name.textContent = spec.label;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step);
    input.value = String(this.params[spec.key]);
    input.dataset.param = spec.key;
    const output = document.createElement('output');
    output.textContent = `${fmt(this.params[spec.key])} ${spec.unit}`;
    input.addEventListener('input', () => {
      this.params[spec.key] = Number(input.value);
      output.textContent = `${fmt(this.params[spec.key])} ${spec.unit}`;
      if (spec.key === 'shift' && this.animateBox.checked) this.setAnimating(false);
      this.updateReadout();
      this.render();
    });
    this.inputs.set(spec.key, input);
    this.outputs.set(spec.key, output);
    field.append(name, input, output);
    return field;
  }

  private reset() {
    this.setAnimating(false);
    this.animateBox.checked = false;
    this.params = { ...DEFAULTS };
    for (const spec of SLIDERS) {
      this.inputs.get(spec.key)!.value = String(DEFAULTS[spec.key]);
      this.outputs.get(spec.key)!.textContent = `${fmt(DEFAULTS[spec.key])} ${spec.unit}`;
    }
    this.updateReadout();
    this.render();
  }

  private setAnimating(on: boolean) {
    cancelAnimationFrame(this.frame);
    if (!on || this.reducedMotion) return;
    this.start = performance.now();
    const tick = (now: number) => {
      const phase = ((now - this.start) / ANIMATION_PERIOD_MS) * 2 * Math.PI;
      const shift = Math.round(12 * Math.sin(phase) * 10) / 10;
      this.params.shift = shift;
      const spec = SLIDERS[2];
      this.inputs.get('shift')!.value = String(shift);
      this.outputs.get('shift')!.textContent = `${fmt(shift)} ${spec.unit}`;
      this.render();
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private updateReadout() {
    const { pitch, angle } = this.params;
    const period = beatPeriod(BASE_PITCH, pitch, angle);
    if (!Number.isFinite(period) || period > 5000) {
      this.readout.textContent =
        'The two gratings match exactly, so there is no beat pattern. Change the pitch or the rotation.';
      return;
    }
    const gain = period / pitch;
    this.readout.textContent =
      `Beat period ≈ ${fmt(period, 0)} px, about ${fmt(period / BASE_PITCH, 0)}× the grating pitch. ` +
      `A 1 px shift of the top layer moves the fringes by roughly ${fmt(gain, 0)} px.`;
  }

  private resize() {
    const width = Math.max(1, Math.floor(this.clientWidth));
    const height = Math.round(width * ASPECT);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.render();
  }

  private render() {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    const dpr = W / Math.max(1, canvas.clientWidth);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#141414';

    // Bottom grating: vertical stripes.
    const p1 = BASE_PITCH * dpr;
    for (let x = 0; x < W; x += p1) ctx.fillRect(x, 0, p1 * DUTY, H);

    // Top grating: shifted and rotated about the centre. Overdraw so the
    // rotated stripes still cover the corners.
    const p2 = this.params.pitch * dpr;
    ctx.save();
    ctx.translate(W / 2 + this.params.shift * dpr, H / 2);
    ctx.rotate((this.params.angle * Math.PI) / 180);
    const reach = Math.hypot(W, H);
    const startX = -Math.ceil(reach / p2) * p2;
    for (let x = startX; x < reach; x += p2) ctx.fillRect(x, -reach, p2 * DUTY, 2 * reach);
    ctx.restore();
  }
}

if (!customElements.get('moire-explorer')) customElements.define('moire-explorer', MoireExplorer);
