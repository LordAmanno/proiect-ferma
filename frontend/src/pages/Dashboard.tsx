import { ArrowUpRight, Droplets, Wind, Loader2, CloudRain, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWeather } from '../hooks/useWeather';
import { useFinance } from '../hooks/useFinance';
import { useTasks } from '../hooks/useTasks';
import { useCrops } from '../hooks/useCrops';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { useCurrency } from '../context/useCurrency';

export default function Dashboard() {
  const { weather, loading: weatherLoading, error: weatherError } = useWeather();
  const { summary, transactions, loading: financeLoading } = useFinance();
  const { tasks, loading: tasksLoading } = useTasks();
  const { crops, loading: cropsLoading } = useCrops();
  const { formatMoney } = useCurrency();
  const todayDate = format(new Date(), 'EEEE, d MMMM');

  const loading = financeLoading || tasksLoading || cropsLoading;

  // Calculate active tasks
  const activeTasks = tasks.filter(t => t.status !== 'Completed').length;
  const urgentTasks = tasks.filter(t => t.status !== 'Completed' && t.priority === 'High').length;

  // Calculate active crops
  const activeCropsCount = crops.filter(c => c.status === 'Growing' || c.status === 'Planted').length;
  const readyToHarvestCount = crops.filter(c => c.status === 'Ready to Harvest').length;

  // Prepare chart data (Last 7 days income)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayTransactions = transactions.filter(t => 
      t.type === 'Income' && isSameDay(parseISO(t.date), date)
    );
    const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      name: format(date, 'EEE'),
      sales: total
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Farm Overview</h2>
      
      {/* Weather Section */}
      {weatherLoading ? (
        <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-2xl animate-pulse">
          <div className="flex flex-col items-center gap-4">
             <Loader2 className="animate-spin text-blue-500" size={48} />
             <p className="text-gray-500 dark:text-gray-400">Loading weather forecast...</p>
          </div>
        </div>
      ) : weatherError ? (
        <div className="flex items-center justify-center h-96 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800">
          <p>{weatherError}</p>
        </div>
      ) : weather && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Weather Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 font-medium text-lg">Current Weather</p>
                  <h3 className="text-4xl font-bold mt-1">{weather.location}</h3>
                  <p className="text-blue-100 mt-2 flex items-center gap-2"><Calendar size={18} /> {todayDate}</p>
                </div>
                <weather.current.icon size={80} className={weather.current.isDay ? "text-yellow-300 animate-pulse" : "text-gray-200"} />
              </div>

              <div className="mt-8 flex items-end gap-4">
                <span className="text-7xl font-bold">{weather.current.temp}°</span>
                <span className="text-2xl font-medium mb-2">{weather.current.condition}</span>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-6">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-100 mb-1">
                    <Wind size={18} /> Wind
                  </div>
                  <p className="text-xl font-bold">{weather.current.windSpeed} km/h</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-100 mb-1">
                    <Droplets size={18} /> Humidity
                  </div>
                  <p className="text-xl font-bold">{weather.current.humidity}%</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-100 mb-1">
                    <CloudRain size={18} /> Precip
                  </div>
                   <p className="text-xl font-bold">{weather.current.precip} mm</p>
                </div>
              </div>
            </div>
            
            {/* Decorative background circle */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          {/* 5-Day Forecast */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">5-Day Forecast</h3>
            <div className="space-y-4">
              {weather.daily.map((day, index) => {
                const Icon = day.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <span className="font-medium text-gray-600 dark:text-gray-400 w-24">{day.day}</span>
                    <div className="flex items-center gap-3 flex-1">
                      <Icon size={20} className={day.condition.includes('Clear') || day.condition.includes('Sunny') ? 'text-yellow-500' : 'text-blue-500'} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">{day.condition}</span>
                    </div>
                    <div className="flex gap-2">
                       <span className="font-bold text-gray-800 dark:text-white">{day.maxTemp}°</span>
                       <span className="font-medium text-gray-400 dark:text-gray-500">{day.minTemp}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Revenue (All Time)</h3>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatMoney(summary.income)}</p>
            <span className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
              <ArrowUpRight size={16} className="ml-1" />
            </span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Tasks</h3>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeTasks}</p>
            <span className="text-gray-400 dark:text-gray-500 text-sm">{urgentTasks} urgent</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Crops</h3>
          <div className="flex items-end justify-between mt-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCropsCount}</p>
            <span className="text-gray-400 dark:text-gray-500 text-sm">{readyToHarvestCount} ready to harvest</span>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Weekly Income</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                itemStyle={{ color: '#F3F4F6' }}
              />
              <Bar dataKey="sales" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
