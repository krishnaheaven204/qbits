"use client";
import React from "react";

export default function DataTable({ columns, data }) {
  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead className="table-light">
          <tr>
            {columns.map((col) => (
              <th
                key={col.accessorKey}
                className="text-nowrap"
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
                className="text-center text-muted"
              >
                No data found
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td
                    key={col.accessorKey}
                    className="text-nowrap"
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
