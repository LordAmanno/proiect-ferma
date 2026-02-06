import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Sector } from 'recharts';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { useCurrency } from '../context/useCurrency';
import { useFinance } from '../hooks/useFinance';
import { useCrops } from '../hooks/useCrops';
import { useMemo, useState } from 'react';
import { parseISO, getYear, getMonth } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const CustomTooltip = ({ active, payload, label, type }: any) => {
  const { formatMoney } = useCurrency();
  
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-lg text-white z-50">
        <p className="font-bold mb-2">{label || payload[0].name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color || entry.payload.fill }}
            />
            <span className="text-gray-300 text-sm">{entry.name}:</span>
            <span className="font-medium text-sm">
              {type === 'money' ? formatMoney(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs fill-gray-600 dark:fill-gray-300">{`${payload.name}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs fill-gray-500 dark:fill-gray-400">
        {`$${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

const RADIAN = Math.PI / 180;

export default function Reports() {
  const { transactions, loading: financeLoading, error: financeError } = useFinance();
  const { crops, loading: cropsLoading, error: cropsError } = useCrops();
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const loading = financeLoading || cropsLoading;
  const error = financeError || cropsError;

  const revenueByCropData = useMemo(() => {
    if (!transactions || !crops) return [];
    
    const cropRevenue: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.type === 'Income' && t.relatedCropId) {
        const crop = crops.find(c => c.id === t.relatedCropId);
        const cropName = crop ? crop.name : 'Unknown Crop';
        cropRevenue[cropName] = (cropRevenue[cropName] || 0) + t.amount;
      }
    });

    return Object.entries(cropRevenue).map(([name, value]) => ({
      name,
      value
    }));
  }, [transactions, crops]);

  const expenseData = useMemo(() => {
    if (!transactions) return [];
    
    const expenses: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.type === 'Expense') {
        const category = t.category || 'Uncategorized';
        expenses[category] = (expenses[category] || 0) + t.amount;
      }
    });

    return Object.entries(expenses).map(([name, value]) => ({
      name,
      value
    }));
  }, [transactions]);

  const profitData = useMemo(() => {
    if (!transactions) return [];

    const monthlyStats: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const currentYear = new Date().getFullYear();
    
    transactions.forEach(t => {
      const date = parseISO(t.date);
      if (getYear(date) === currentYear) {
        const monthIndex = getMonth(date);
        const monthName = months[monthIndex];
        const amount = t.type === 'Income' ? t.amount : -t.amount;
        monthlyStats[monthName] = (monthlyStats[monthName] || 0) + amount;
      }
    });

    return Object.entries(monthlyStats)
        .map(([month, profit]) => ({ month, profit }))
        .sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="h-6 w-6 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Reports & Analytics</h2>
        <button className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
          <Download size={20} /> Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Revenue by Crop */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Revenue by Crop</h3>
          <div className="h-64 w-full min-w-0">
            {revenueByCropData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByCropData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                    cursor={{fill: 'rgba(255, 255, 255, 0.1)'}}
                    content={<CustomTooltip type="money" />}
                    />
                    <Bar dataKey="value" fill="#16a34a" name="Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No crop revenue data available
                </div>
            )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div 
          className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 group"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Expense Breakdown</h3>
          <div className="h-64 w-full min-w-0">
            {expenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    {...{ activeIndex } as any}
                    activeShape={renderActiveShape}
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    >
                    {expenseData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip type="money" />} />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No expense data available
                </div>
            )}
          </div>
          {expenseData.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-4">
                {expenseData.map((entry, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-2 cursor-pointer transition-opacity ${index === activeIndex ? 'opacity-100 font-bold' : 'opacity-70 hover:opacity-100'}`}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{entry.name}</span>
                </div>
                ))}
            </div>
          )}
        </div>

        {/* Monthly Profit */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Monthly Profit</h3>
            <div className="h-64 w-full min-w-0">
            {profitData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip content={<CustomTooltip type="money" />} />
                    <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No profit data available
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}
