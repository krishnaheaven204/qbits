'use client';

import { use } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import InverterSummary from '@/tab/inverter-summary/InverterSummary';

export default function InverterSummaryPage(props) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);

  const inverterId = params?.inverterId ?? null;
  const plantNo =
    typeof searchParams?.get === 'function'
      ? searchParams.get('plant_no')
      : searchParams?.plant_no ?? null;

  return (
    <ProtectedRoute>
      <InverterSummary inverterId={inverterId} plantNo={plantNo} />
    </ProtectedRoute>
  );
}
