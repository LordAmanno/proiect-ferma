import { useState } from 'react';
import { Map, Sprout, Calendar, Loader2, X } from 'lucide-react';
import { useCrops, type Crop } from '../hooks/useCrops';
import { format, parseISO } from 'date-fns';

export default function Crops() {
  const { crops, fields, loading, error, addCrop } = useCrops();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<Crop, 'id'>>({
    name: '',
    variety: '',
    fieldId: '',
    plantingDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: '',
    status: 'Planted',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addCrop({
        ...formData,
        plantingDate: new Date(formData.plantingDate).toISOString(),
        expectedHarvestDate: formData.expectedHarvestDate ? new Date(formData.expectedHarvestDate).toISOString() : undefined,
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        variety: '',
        fieldId: '',
        plantingDate: new Date().toISOString().split('T')[0],
        expectedHarvestDate: '',
        status: 'Planted',
      });
    } catch (err) {
      console.error(err);
      // Ideally show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        Error loading crops data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Field & Crop Management</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
        >
          <Sprout size={20} /> Register New Crop
        </button>
      </div>

      {/* Fields Grid */}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Fields Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {fields.map((field) => {
          const activeCrop = crops.find(c => c.fieldId === field.id && (c.status === 'Growing' || c.status === 'Planted' || c.status === 'Ready to Harvest'));
          
          return (
            <div key={field.id} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:border-green-200 dark:hover:border-green-800 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Map size={64} className="text-green-600 dark:text-green-500" />
              </div>
              <div className="relative z-10">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{field.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{field.areaHectares} Hectares • {field.soilType || 'Unknown Soil'}</p>
                
                <div className="mt-4">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Current Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-3 h-3 rounded-full ${field.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="font-medium text-gray-800 dark:text-white">{field.status}</span>
                  </div>
                </div>

                {activeCrop && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
                    <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase">{activeCrop.status}</p>
                    <p className="text-green-900 dark:text-green-300 font-medium">{activeCrop.name} {activeCrop.variety ? `(${activeCrop.variety})` : ''}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Crop Calendar / History */}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-8">Crop History & Rotation</h3>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
            <tr>
              <th className="p-4">Field</th>
              <th className="p-4">Crop</th>
              <th className="p-4">Planting Date</th>
              <th className="p-4">Harvest Date</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {crops.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No crop history found.
                </td>
              </tr>
            ) : (
              crops.map((crop) => {
                const fieldName = fields.find(f => f.id === crop.fieldId)?.name || 'Unknown Field';
                return (
                  <tr key={crop.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{fieldName}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{crop.name} {crop.variety ? `(${crop.variety})` : ''}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Calendar size={14} /> {format(parseISO(crop.plantingDate), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">
                      {crop.actualHarvestDate 
                        ? format(parseISO(crop.actualHarvestDate), 'MMM d, yyyy') 
                        : crop.expectedHarvestDate 
                          ? `Exp: ${format(parseISO(crop.expectedHarvestDate), 'MMM d, yyyy')}` 
                          : '-'}
                    </td>
                    <td className="p-4 font-medium text-green-600 dark:text-green-400">{crop.status}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Register Crop Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Register New Crop</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Crop Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. Corn, Wheat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Variety (Optional)
                </label>
                <input
                  type="text"
                  name="variety"
                  value={formData.variety}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. Sweet Corn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Field
                </label>
                <select
                  name="fieldId"
                  required
                  value={formData.fieldId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">Select a field</option>
                  {fields.map(field => (
                    <option key={field.id} value={field.id}>{field.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Planting Date
                  </label>
                  <input
                    type="date"
                    name="plantingDate"
                    required
                    value={formData.plantingDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expected Harvest
                  </label>
                  <input
                    type="date"
                    name="expectedHarvestDate"
                    value={formData.expectedHarvestDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="Planted">Planted</option>
                  <option value="Growing">Growing</option>
                  <option value="Ready to Harvest">Ready to Harvest</option>
                  <option value="Harvested">Harvested</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Crop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
