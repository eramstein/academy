type PlacePickSession = {
  allowedKeys: string[];
  complete: (placeKey: string) => void;
  cancel?: () => void;
};

/** Active destination pick: map on the right, click moves / fills placeKey. */
export const placePickSession = $state({
  current: null as PlacePickSession | null,
});

export function clearPlacePickSession() {
  placePickSession.current = null;
}
