'use client';
import {UNIT_OPTIONS,type NodeId} from './boards';
import HsseBoard from '../features/hsse/HsseBoard';
import MarketBoard from '../features/market/MarketBoard';
import PdfReports from '../features/pdf/PdfReports';
import {isMarketView} from '@/lib/market-demo/model';
import {isReportCategory} from '@/lib/pdf-reports/types';
export const viewRenderers = {
 hsse: ({selected,unit,primary}:ViewProps) => <HsseBoard year={2026} primary={primary} active={selected==='hsse'&&unit==='全部板块'}/>,
 market: ({selected,unit,primary}:ViewProps) => <MarketBoard view={isMarketView(selected)?selected:null} unit={unit} units={UNIT_OPTIONS} primary={primary}/>,
 pdf: ({selected,unit,primary}:ViewProps) => isReportCategory(selected)?<PdfReports key={selected} category={selected} unit={unit} year={2026} units={UNIT_OPTIONS} primary={primary}/>:null,
};
export type ViewProps={selected:NodeId;unit:string;primary:string};

export type RendererId=keyof typeof viewRenderers;
