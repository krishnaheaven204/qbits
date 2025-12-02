"use client";
import React from "react";

export default function DataTable({ columns, data }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-max table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-900 text-sm font-semibold">
            {columns.map((col) => (
              <th
                key={col.accessorKey}
                className="px-4 py-3 border-b border-gray-200 whitespace-nowrap"
                style={{ minWidth: col.minWidth || 150 }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-6 text-center text-gray-500"
              >
                No data found
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={index}
                className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.accessorKey}
                    className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200 whitespace-nowrap"
                  >
                    {row[col.accessorKey] ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
