'use client';

import PlantDetails from '@/tab/plant-details/PlantDetails';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function PlantDetailsPage() {
  return (
    <ProtectedRoute>
      <PlantDetails />
    </ProtectedRoute>
  );
}
