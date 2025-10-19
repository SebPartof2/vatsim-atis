

import { loadIcaoToName } from './vatspyParser';

export function fetchVatSpyMapping() {
  return loadIcaoToName();
}
