import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { doc, getDoc } from "firebase/firestore";
import { db, logFirebaseEvent } from "../firebaseConfig";
import { useParams, useNavigate } from "react-router-dom";
import VitalChart from "./VitalChart";

export default function UserTable({ userId: propUserId }) {
  const params = useParams();
  const navigate = useNavigate();
  const userId = propUserId || params.userId;

  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


   useEffect(() => {
    logFirebaseEvent("page_view", {
      page_name: "UserTable",
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setError("No user ID provided");
      setLoading(false);
      return;
    }

    const fetchVitals = async () => {
      setLoading(true);
      setError("");
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (!userDoc.exists()) {
          setError("User not found");
          setVitals([]);
        } else {
          const data = userDoc.data();
          const arr = Array.isArray(data.vitals) ? data.vitals : [];
          // normalize: ensure nested objects exist and preserve original dateAdded
          const normalized = arr.map((v, i) => ({
            _idx: i,
            dateAdded: v?.dateAdded ?? "",
            systolicValue: v?.systolic?.value ?? (v?.systolic ?? null),
            diastolicValue: v?.diastolic?.value ?? (v?.diastolic ?? null),
            pulseValue: v?.pulse?.value ?? (v?.pulse ?? null),
            bloodSugarValue: v?.bloodSugar?.value ?? (v?.bloodSugar ?? null),
            systolicUnit: v?.systolic?.unit ?? "mmHg",
            diastolicUnit: v?.diastolic?.unit ?? "mmHg",
            pulseUnit: v?.pulse?.unit ?? "bpm",
            bloodSugarUnit: v?.bloodSugar?.unit ?? "mg/dL",
          }));
          // sort descending by dateAdded (if parsable)
          normalized.sort((a, b) => {
            const da = Date.parse(a.dateAdded) || 0;
            const dbt = Date.parse(b.dateAdded) || 0;
            return dbt - da;
          });
          setVitals(normalized);

           logFirebaseEvent("vitals_loaded", {
            user_id: userId,
            vitals_count: normalized.length,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load vitals");
        setVitals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVitals();
  }, [userId]);

  const data = useMemo(() => vitals, [vitals]);

  // BP table (systolic, diastolic, pulse)
  const bpColumns = useMemo(
    () => [
      {
        accessorKey: "dateAdded",
        header: "Date Added",
        cell: (info) => info.getValue() || "-",
      },
      {
        accessorFn: (row) => row.systolicValue,
        id: "systolic",
        header: "Systolic",
        cell: (info) =>
          info.getValue() == null ? "-" : `${info.getValue()} ${info.row.original.systolicUnit}`,
        enableSorting: true,
      },
      {
        accessorFn: (row) => row.diastolicValue,
        id: "diastolic",
        header: "Diastolic",
        cell: (info) =>
          info.getValue() == null ? "-" : `${info.getValue()} ${info.row.original.diastolicUnit}`,
        enableSorting: true,
      },
      {
        accessorFn: (row) => row.pulseValue,
        id: "pulse",
        header: "Pulse",
        cell: (info) =>
          info.getValue() == null ? "-" : `${info.getValue()} ${info.row.original.pulseUnit}`,
        enableSorting: true,
      },
    ],
    []
  );

  // Blood sugar table
  const sugarColumns = useMemo(
    () => [
      {
        accessorKey: "dateAdded",
        header: "Date Added",
        cell: (info) => info.getValue() || "-",
      },
      {
        accessorFn: (row) => row.bloodSugarValue,
        id: "bloodSugar",
        header: "Blood Sugar",
        cell: (info) =>
          info.getValue() == null ? "-" : `${info.getValue()} ${info.row.original.bloodSugarUnit}`,
        enableSorting: true,
      },
    ],
    []
  );

  // Separate table states so each table sorts/filters independently
  const [bpSorting, setBpSorting] = useState([{ id: "dateAdded", desc: true }]);
  const [bpFilters, setBpFilters] = useState([]);

  const [sugarSorting, setSugarSorting] = useState([{ id: "dateAdded", desc: true }]);
  const [sugarFilters, setSugarFilters] = useState([]);

  const bpTable = useReactTable({
    data,
    columns: bpColumns,
    state: { sorting: bpSorting, columnFilters: bpFilters },
    onSortingChange: setBpSorting,
    onColumnFiltersChange: setBpFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const sugarTable = useReactTable({
    data,
    columns: sugarColumns,
    state: { sorting: sugarSorting, columnFilters: sugarFilters },
    onSortingChange: setSugarSorting,
    onColumnFiltersChange: setSugarFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) {
    return (
      <div className="p-4 bg-white rounded shadow text-center">
        Loading vitals...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded shadow text-red-600 text-center">
        {error}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="p-4 bg-white rounded shadow text-center">
        No vitals recorded for this user.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Vitals Tables</h3>
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-sm cursor-pointer px-3 py-1 text-white rounded bg-[#6930C3] hover:bg-[#7400B8]"
            >
              Back
            </button>
          </div>
        </div>

        {/* Two tables side-by-side on large screens, stacked on small screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BP Table */}
          <div className="overflow-x-auto bg-white rounded border p-3">
            <h4 className="font-medium mb-2">Blood Pressure (Systolic / Diastolic / Pulse)</h4>
            <table className="min-w-full text-sm">
              <thead>
                {bpTable.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-left px-3 py-2 border-b bg-gray-50"
                      >
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: " ▲",
                            desc: " ▼",
                          }[header.column.getIsSorted()] ?? null}
                        </div>

                        {header.column.getCanFilter() && (
                          <div className="mt-1">
                            <input
                              value={header.column.getFilterValue() ?? ""}
                              onChange={(e) => header.column.setFilterValue(e.target.value)}
                              placeholder="Filter..."
                              className="mt-1 px-2 py-1 border rounded text-xs w-full"
                            />
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {bpTable.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="odd:bg-white even:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 border-b">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Blood Sugar Table */}
          <div className="overflow-x-auto bg-white rounded border p-3">
            <h4 className="font-medium mb-2">Blood Sugar</h4>
            <table className="min-w-full text-sm">
              <thead>
                {sugarTable.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-left px-3 py-2 border-b bg-gray-50"
                      >
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: " ▲",
                            desc: " ▼",
                          }[header.column.getIsSorted()] ?? null}
                        </div>

                        {header.column.getCanFilter() && (
                          <div className="mt-1">
                            <input
                              value={header.column.getFilterValue() ?? ""}
                              onChange={(e) => header.column.setFilterValue(e.target.value)}
                              placeholder="Filter..."
                              className="mt-1 px-2 py-1 border rounded text-xs w-full"
                            />
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {sugarTable.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="odd:bg-white even:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 border-b">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chart(s) */}
      {!loading && !error && data.length > 0 && (
        <VitalChart vitals={vitals} />
      )}
    </div>
  );
}