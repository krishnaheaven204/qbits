'use client';

import { use } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import InverterDetails from '@/tab/inverter-details/InverterDetails';

export default function InverterDetailsPage(props) {
  // Next.js 16: params/searchParams are Promises in client components
  const params = use(props.params);
  const searchParams = use(props.searchParams);

  const inverterId = params?.inverterId ?? null;
  const plantNo =
    typeof searchParams?.get === 'function'
      ? searchParams.get('plant_no')
      : searchParams?.plant_no ?? null;

  return (
    <ProtectedRoute>
      <InverterDetails inverterId={inverterId} plantNo={plantNo} />
    </ProtectedRoute>
  );
}
