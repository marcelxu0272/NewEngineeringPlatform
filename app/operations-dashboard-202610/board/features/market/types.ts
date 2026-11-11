import {Contract,Framework,Opportunity,MarketSelection} from '@/lib/market-demo/model';
export type Detail = { title: string; kind: 'opportunities' | 'contracts' | 'frameworks'; rows: (Opportunity | Contract | Framework)[] };
export type SummaryRow = { id: string; unit: string; type: string; span: number; serial?: number; estimated: number; bid: number; weighted: number; target: number; signed: number; unsignedWon: number; summary?: boolean };


export type DetailHandler=(title:string,kind:Detail['kind'],rows:Detail['rows'])=>void;
export type ViewProps={data:MarketSelection;primary:string;onDetails:DetailHandler};
