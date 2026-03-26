"use client";

import { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import * as HighchartsFunnelModule from "highcharts/modules/funnel";
import * as HighchartsAnnotationsModule from "highcharts/modules/annotations";
import type { Options } from "highcharts";

let highchartsModulesRegistered = false;

function registerHighchartsModules() {
  if (typeof window === "undefined" || highchartsModulesRegistered) return;
  highchartsModulesRegistered = true;
  const funnelFn =
    (
      HighchartsFunnelModule as unknown as {
        default?: (h: typeof Highcharts) => void;
      }
    ).default ??
    (HighchartsFunnelModule as unknown as (h: typeof Highcharts) => void);
  if (typeof funnelFn === "function") funnelFn(Highcharts);
  const annFn =
    (
      HighchartsAnnotationsModule as unknown as {
        default?: (h: typeof Highcharts) => void;
      }
    ).default ??
    (HighchartsAnnotationsModule as unknown as (h: typeof Highcharts) => void);
  if (typeof annFn === "function") annFn(Highcharts);
}

function useHighchartsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    registerHighchartsModules();
    setReady(true);
  }, []);
  return ready;
}

export function MarketFunnelChart({ options }: { options: Options }) {
  const ready = useHighchartsReady();
  if (!ready) {
    return <div className="h-[170px] w-full" aria-hidden />;
  }
  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
      containerProps={{ className: "w-full", style: { minHeight: 170 } }}
    />
  );
}

export function WipReceivableBarChart({ options }: { options: Options }) {
  const ready = useHighchartsReady();
  if (!ready) {
    return <div className="h-[220px] w-full" aria-hidden />;
  }
  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
      containerProps={{ className: "w-full", style: { minHeight: 220 } }}
    />
  );
}
