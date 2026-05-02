"use client";

import { useState } from "react";
import { PlotStages } from "./plot-stages";
import { PlotAnalytics } from "./plot-analytics";

export function PlotStagesPanel({
  plotId,
  costEgp,
  sellingPriceEgp,
  analyticsOnly = false,
}: {
  plotId: number;
  costEgp: number;
  sellingPriceEgp: number;
  analyticsOnly?: boolean;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  if (analyticsOnly) {
    return (
      <PlotAnalytics
        plotId={plotId}
        costEgp={costEgp}
        sellingPriceEgp={sellingPriceEgp}
        refreshKey={refreshKey}
      />
    );
  }
  return (
    <PlotStages plotId={plotId} onChanged={() => setRefreshKey((k) => k + 1)} />
  );
}
