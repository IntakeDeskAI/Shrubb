'use client';

import { useState } from 'react';
import type { PlannerJson } from '@landscape-ai/shared';

interface PreviewTabsProps {
  projectId: string;
  plannerJson: PlannerJson | null;
  assets: Array<{
    id: string;
    asset_type: string;
    storage_path: string;
    metadata: Record<string, unknown>;
  }>;
}

type TabId = 'renders' | 'layout' | 'plants' | 'materials' | 'pdf';

const TABS: { id: TabId; label: string }[] = [
  { id: 'renders', label: 'Renders' },
  { id: 'layout', label: 'Layout' },
  { id: 'plants', label: 'Plant List' },
  { id: 'materials', label: 'Materials' },
  { id: 'pdf', label: 'PDF' },
];

export function PreviewTabs({ plannerJson, assets }: PreviewTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('renders');

  const renderAssets = assets.filter((a) => a.asset_type === 'render');
  const layoutAsset = assets.find((a) => a.asset_type === 'layout');
  const pdfAsset = assets.find((a) => a.asset_type === 'pdf');

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="-mb-px flex overflow-x-auto px-6" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'renders' && (
          <RendersTab assets={renderAssets} />
        )}
        {activeTab === 'layout' && (
          <LayoutTab asset={layoutAsset} />
        )}
        {activeTab === 'plants' && (
          <PlantListTab plannerJson={plannerJson} />
        )}
        {activeTab === 'materials' && (
          <MaterialsTab plannerJson={plannerJson} />
        )}
        {activeTab === 'pdf' && <PdfTab asset={pdfAsset} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Renders Tab                                                        */
/* ------------------------------------------------------------------ */

function RendersTab({
  assets,
}: {
  assets: Array<{
    id: string;
    storage_path: string;
    metadata: Record<string, unknown>;
  }>;
}) {
  if (assets.length === 0) {
    return <EmptyState message="Renders will appear here after your design is generated." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.storage_path}
            alt="Design render"
            className="h-48 w-full object-cover"
          />
          {typeof asset.metadata?.label === 'string' && (
            <div className="px-3 py-2">
              <p className="text-xs text-gray-500">{asset.metadata.label}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Layout Tab                                                         */
/* ------------------------------------------------------------------ */

function LayoutTab({
  asset,
}: {
  asset?: {
    id: string;
    storage_path: string;
    metadata: Record<string, unknown>;
  };
}) {
  if (!asset) {
    return <EmptyState message="Layout will appear after generation." />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.storage_path}
        alt="Annotated layout"
        className="w-full object-contain"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Plant List Tab                                                     */
/* ------------------------------------------------------------------ */

function PlantListTab({ plannerJson }: { plannerJson: PlannerJson | null }) {
  if (!plannerJson?.plant_palette || plannerJson.plant_palette.length === 0) {
    return <EmptyState message="Plant list will appear after your design is generated." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="whitespace-nowrap pb-3 pr-4 font-medium text-gray-900">
              Common Name
            </th>
            <th className="whitespace-nowrap pb-3 pr-4 font-medium text-gray-900">
              Botanical Name
            </th>
            <th className="whitespace-nowrap pb-3 pr-4 font-medium text-gray-900 text-right">
              Qty
            </th>
            <th className="whitespace-nowrap pb-3 pr-4 font-medium text-gray-900">
              Sun
            </th>
            <th className="whitespace-nowrap pb-3 pr-4 font-medium text-gray-900">
              Water
            </th>
            <th className="whitespace-nowrap pb-3 font-medium text-gray-900">
              Zones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {plannerJson.plant_palette.map((plant, i) => (
            <tr key={`${plant.botanical_name}-${i}`} className="hover:bg-gray-50">
              <td className="whitespace-nowrap py-2.5 pr-4 text-gray-900">
                {plant.common_name}
              </td>
              <td className="whitespace-nowrap py-2.5 pr-4 italic text-gray-500">
                {plant.botanical_name}
              </td>
              <td className="whitespace-nowrap py-2.5 pr-4 text-right text-gray-700">
                {plant.quantity_estimate}
              </td>
              <td className="whitespace-nowrap py-2.5 pr-4 text-gray-700">
                {plant.sun}
              </td>
              <td className="whitespace-nowrap py-2.5 pr-4 text-gray-700">
                {plant.water}
              </td>
              <td className="whitespace-nowrap py-2.5 text-gray-700">
                {plant.zone_range}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Materials Tab                                                      */
/* ------------------------------------------------------------------ */

function MaterialsTab({ plannerJson }: { plannerJson: PlannerJson | null }) {
  if (!plannerJson?.materials || plannerJson.materials.length === 0) {
    return <EmptyState message="Materials list will appear after your design is generated." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="whitespace-nowrap pb-3 pr-4 font-medium text-gray-900">
              Material
            </th>
            <th className="whitespace-nowrap pb-3 pr-4 font-medium text-gray-900">
              Quantity
            </th>
            <th className="whitespace-nowrap pb-3 font-medium text-gray-900 text-right">
              Est. Cost
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {plannerJson.materials.map((material, i) => (
            <tr key={`${material.name}-${i}`} className="hover:bg-gray-50">
              <td className="whitespace-nowrap py-2.5 pr-4 text-gray-900">
                {material.name}
              </td>
              <td className="whitespace-nowrap py-2.5 pr-4 text-gray-700">
                {material.quantity}
              </td>
              <td className="whitespace-nowrap py-2.5 text-right text-gray-700">
                {material.estimated_cost}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {plannerJson.estimated_budget && (
        <div className="mt-4 rounded-lg bg-brand-50 px-4 py-3">
          <p className="text-sm font-medium text-brand-700">
            Estimated Budget: {plannerJson.estimated_budget}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PDF Tab                                                            */
/* ------------------------------------------------------------------ */

function PdfTab({
  asset,
}: {
  asset?: {
    id: string;
    storage_path: string;
    metadata: Record<string, unknown>;
  };
}) {
  if (!asset) {
    return <EmptyState message="PDF will be available after generation." />;
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
        <svg
          className="h-8 w-8 text-brand-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p className="mb-4 text-sm text-gray-600">
        Your landscape design PDF is ready.
      </p>
      <a
        href={asset.storage_path}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
      >
        Download PDF
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}
