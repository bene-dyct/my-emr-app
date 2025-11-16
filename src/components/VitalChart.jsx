import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, subMonths, isAfter } from 'date-fns';

const SYSTOLIC_MIN = 80;
const SYSTOLIC_MAX = 120;
const DIASTOLIC_MIN = 60;
const DIASTOLIC_MAX = 80;
const PULSE_MIN = 60;
const PULSE_MAX = 90;
const BLOOD_SUGAR_MIN = 70;
const BLOOD_SUGAR_MAX = 100;

export default function VitalChart({ vitals }) {
  const [activeVital, setActiveVital] = useState(null);
  const [filterRange, setFilterRange] = useState('all');

  const getVitalStatus = (type, value) => {
    if (value === null || value === undefined || value === '') return 'No reading';
    const val = Number(value);
    switch (type) {
      case 'systolic':
        if (val < SYSTOLIC_MIN) return 'Lower than Average ▼';
        if (val > SYSTOLIC_MAX) return 'Higher than Average ▲';
        return 'Normal Range';
      case 'diastolic':
        if (val < DIASTOLIC_MIN) return 'Lower than Average ▼';
        if (val > DIASTOLIC_MAX) return 'Higher than Average ▲';
        return 'Normal Range';
      case 'pulse':
        if (val < PULSE_MIN) return 'Lower than Average ▼';
        if (val > PULSE_MAX) return 'Higher than Average ▲';
        return 'Normal Range';
      case 'bloodSugar':
        if (val < BLOOD_SUGAR_MIN) return 'Lower than Average ▼';
        if (val > BLOOD_SUGAR_MAX) return 'Higher than Average ▲';
        return 'Normal Range';
      default:
        return 'Unknown';
    }
  };

  // ✅ Sort oldest → newest for proper timeline
  const sortedVitals = useMemo(() => {
    return [...vitals].sort(
      (a, b) => new Date(a.dateAdded) - new Date(b.dateAdded)
    );
  }, [vitals]);

  // ✅ Filter by time range
  const filteredVitals = useMemo(() => {
    if (filterRange === 'all') return sortedVitals;
    const now = new Date();
    let cutoffDate;

    switch (filterRange) {
      case '7d':
        cutoffDate = subDays(now, 7);
        break;
      case '30d':
        cutoffDate = subDays(now, 30);
        break;
      case '6m':
        cutoffDate = subMonths(now, 6);
        break;
      case '12m':
        cutoffDate = subMonths(now, 12);
        break;
      default:
        cutoffDate = null;
    }

    return sortedVitals.filter(v => {
      const date = new Date(v.dateAdded);
      return cutoffDate ? isAfter(date, cutoffDate) : true;
    });
  }, [sortedVitals, filterRange]);

  // ✅ Prepare chart data
  const chartData = useMemo(() => {
    return filteredVitals.map(vital => ({
      date: format(new Date(vital.dateAdded), 'dd MMM, yyyy'),
      systolic: Number(vital.systolicValue),
      diastolic: Number(vital.diastolicValue),
      pulse: Number(vital.pulseValue),
      bloodSugar: Number(vital.bloodSugarValue),
      dateAdded: vital.dateAdded,
    }));
  }, [filteredVitals]);

  // ✅ Latest (most recent) data
  const latestVital = useMemo(() => {
    if (!filteredVitals.length) return null;
    return filteredVitals[filteredVitals.length - 1];
  }, [filteredVitals]);

  // ✅ Display either hovered or latest
  const displayedVital = activeVital
    ? {
        systolicValue: activeVital.systolic,
        diastolicValue: activeVital.diastolic,
        pulseValue: activeVital.pulse,
        bloodSugarValue: activeVital.bloodSugar,
        dateAdded: activeVital.dateAdded,
      }
    : latestVital;

  // Custom tooltip used by both charts - sets activeVital to the full payload object
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      // payload contains all fields because chartData includes all keys
      setActiveVital(data);
      return (
        <div className="bg-white p-2 border rounded shadow-lg">
          <p className="text-sm font-medium">{data.date}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleMouseLeave = () => setActiveVital(null);

  if (!vitals.length) {
    return (
      <div className="text-center p-4">
        No vitals data available for charting
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <h2 className="text-xl font-semibold mb-4 lg:mb-0">Vitals Trend</h2>

        {/* ✅ Range filter buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: '7d', label: 'Last 7 Days' },
            { key: '30d', label: 'Last 30 Days' },
            { key: '6m', label: 'Last 6 Months' },
            { key: '12m', label: 'Last 12 Months' },
            { key: 'all', label: 'All Data' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilterRange(opt.key)}
              className={`px-3 py-1 cursor-pointer rounded-md text-sm font-medium border ${
                filterRange === opt.key
                  ? 'bg-[#6930C3] text-white border-[#6930C3]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Charts column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Chart 1: systolic, diastolic, pulse */}
          <div className="w-full bg-white">
            <p className='mb-5 text-xl'>Blood Pressure (Systolic, Diastolic and Pulse readings)</p>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                onMouseLeave={handleMouseLeave}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="systolic"
                  stroke="#FF69B4"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Systolic"
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Diastolic"
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="pulse"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Pulse"
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: blood sugar only */}
          <div className="w-full bg-white">
            <p className='mb-5 text-xl'>Blood Sugar</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                onMouseLeave={handleMouseLeave}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bloodSugar"
                  stroke="#ffc658"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Blood Sugar"
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary panel */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold mb-2">
            {activeVital ? 'Selected Reading' : 'Latest Reading'}
          </h3>

          {displayedVital ? (
            <>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="mb-4">
                  <span className="text-pink-500 font-bold text-xl">Systolic</span>
                  <div className="text-2xl font-bold">
                    {displayedVital.systolicValue ?? '-'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {getVitalStatus('systolic', displayedVital.systolicValue)}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-purple-500 font-bold text-xl">Diastolic</span>
                  <div className="text-2xl font-bold">
                    {displayedVital.diastolicValue ?? '-'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {getVitalStatus('diastolic', displayedVital.diastolicValue)}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-green-500 font-bold text-xl">Pulse</span>
                  <div className="text-2xl font-bold">
                    {displayedVital.pulseValue ?? '-'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {getVitalStatus('pulse', displayedVital.pulseValue)}
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-yellow-600 font-bold text-xl">Blood Sugar</span>
                  <div className="text-2xl font-bold">
                    {displayedVital.bloodSugarValue ?? '-'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {getVitalStatus('bloodSugar', displayedVital.bloodSugarValue)}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Date: {format(new Date(displayedVital.dateAdded), 'MMM dd, yyyy')}
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-sm italic">No readings in this range</div>
          )}
        </div>
      </div>
    </div>
  );
}
