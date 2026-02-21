/**
 * Custom time picker using dual <select> elements (hour + minute).
 * Minutes are restricted to 15-minute increments: 00, 15, 30, 45.
 */

/** Parse "HH:mm" into [hour, minute] */
function parse(time: string): [number, number] {
  const [h, m] = time.split(':').map(Number);
  return [h ?? 0, m ?? 0];
}

/** Format hour + minute back to "HH:mm" */
function fmt(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Snap a minute value to the nearest 15-minute interval */
function snap15(m: number): number {
  return Math.round(m / 15) * 15 % 60;
}

/**
 * Create a custom time picker element.
 * Returns a container div with two <select>s (hour:minute).
 * Fires a "time-change" CustomEvent with `detail.value` = "HH:mm".
 */
export function createTimePicker(value: string, dataField: string, title: string): HTMLDivElement {
  const [h, m] = parse(value);
  const snappedMin = snap15(m);

  const wrapper = document.createElement('div');
  wrapper.className = 'lcars-time-picker';
  wrapper.setAttribute('data-field', dataField);
  wrapper.title = title;

  // Hour select
  const hourSel = document.createElement('select');
  hourSel.className = 'lcars-time-select lcars-time-hour';
  for (let i = 0; i < 24; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = String(i).padStart(2, '0');
    if (i === h) opt.selected = true;
    hourSel.appendChild(opt);
  }

  // Separator
  const sep = document.createElement('span');
  sep.className = 'lcars-time-colon';
  sep.textContent = ':';

  // Minute select
  const minSel = document.createElement('select');
  minSel.className = 'lcars-time-select lcars-time-min';
  for (const min of [0, 15, 30, 45]) {
    const opt = document.createElement('option');
    opt.value = String(min);
    opt.textContent = String(min).padStart(2, '0');
    if (min === snappedMin) opt.selected = true;
    minSel.appendChild(opt);
  }

  const emitChange = (): void => {
    const newValue = fmt(Number(hourSel.value), Number(minSel.value));
    wrapper.setAttribute('data-value', newValue);
    wrapper.dispatchEvent(new CustomEvent('time-change', { detail: { value: newValue }, bubbles: true }));
  };

  hourSel.addEventListener('change', emitChange);
  minSel.addEventListener('change', emitChange);

  wrapper.setAttribute('data-value', fmt(h, snappedMin));
  wrapper.appendChild(hourSel);
  wrapper.appendChild(sep);
  wrapper.appendChild(minSel);

  return wrapper;
}

/** Read the current value from a time picker element */
export function getTimePickerValue(picker: HTMLElement): string {
  return picker.getAttribute('data-value') ?? '09:00';
}
