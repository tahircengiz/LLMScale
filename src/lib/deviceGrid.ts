// How the device grid decides what to show and what to fold away.
//
// The grid used to hide every device the model does not fit — including the one
// the user had selected. Raise the context length, the concurrency or the model
// size far enough and the active card slid into the collapsed group and left the
// screen, while the panel above it went on describing that very device. So the
// selection is pinned to the visible group whether it fits or not, and only the
// devices that are genuinely still hidden are counted on the toggle.
//
// React-free so `node scripts/test-devicegrid.ts` can run it directly.

export interface DeviceSplit<T> {
  /** Rendered straight away: everything that fits, plus the selected device. */
  visible: T[];
  /** Folded behind the toggle. Its length is the number the toggle shows. */
  hidden: T[];
  /** The selected device is in `visible` only because it is selected. */
  selectedOverBudget: boolean;
  /** At least one device fits on its own merit, selection aside. */
  anyFits: boolean;
}

/**
 * Split devices into the shown and the folded group, keeping the selected one
 * shown even when the model has outgrown it. Input order is preserved within
 * both groups, so the caller's sort still holds.
 */
export function splitDevices<T>(
  devices: readonly T[],
  fits: (d: T) => boolean,
  isSelected: (d: T) => boolean
): DeviceSplit<T> {
  const visible: T[] = [];
  const hidden: T[] = [];
  let selectedOverBudget = false;
  let anyFits = false;
  for (const d of devices) {
    if (fits(d)) {
      anyFits = true;
      visible.push(d);
    } else if (isSelected(d)) {
      selectedOverBudget = true;
      visible.push(d);
    } else {
      hidden.push(d);
    }
  }
  return { visible, hidden, selectedOverBudget, anyFits };
}
