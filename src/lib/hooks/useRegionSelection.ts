import { useState, useCallback } from "react";
import { Region } from "../paintByNumbers/types";

export function useRegionSelection() {
  const [selectedRegions, setSelectedRegions] = useState<Set<number>>(
    new Set(),
  );
  const [highlightedRegion, setHighlightedRegion] = useState<number | null>(
    null,
  );

  const selectRegion = useCallback((regionId: number, multiSelect = false) => {
    setSelectedRegions((current) => {
      const newSelection = new Set(multiSelect ? current : []);
      if (newSelection.has(regionId)) {
        newSelection.delete(regionId);
      } else {
        newSelection.add(regionId);
      }
      return newSelection;
    });
  }, []);

  const highlightRegion = useCallback((regionId: number | null) => {
    setHighlightedRegion(regionId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRegions(new Set());
  }, []);

  return {
    selectedRegions,
    highlightedRegion,
    selectRegion,
    highlightRegion,
    clearSelection,
  };
}
