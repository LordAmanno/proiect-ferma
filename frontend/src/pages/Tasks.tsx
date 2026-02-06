import { useState } from 'react';
import { CheckCircle, Circle, Clock, Loader2, AlertCircle, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useWorkers } from '../hooks/useWorkers';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { format, parseISO } from 'date-fns';

export default function Tasks() {
  const { tasks, loading: tasksLoading, error: tasksError, addTask, updateTask, deleteTask } = useTasks();
  const { workers, loading: workersLoading, error: workersError } = useWorkers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    dueDate: '',
    assignedWorkerId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTaskId) {
        await updateTask(editingTaskId, {
          ...newTask,
          dueDate: newTask.dueDate || undefined,
          assignedWorkerId: newTask.assignedWorkerId || undefined
        });
      } else {
        await addTask({
          ...newTask,
          status: 'Pending',
          dueDate: newTask.dueDate || undefined,
          assignedWorkerId: newTask.assignedWorkerId || undefined
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingTaskId(null);
    setNewTask({
      title: '',
      description: '',
      priority: 'Medium',
      dueDate: '',
      assignedWorkerId: ''
    });
  };

  const handleEdit = (task: any) => {
    setEditingTaskId(task.id);
    setNewTask({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedWorkerId: task.assignedWorkerId || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmationId) {
      try {
        await deleteTask(deleteConfirmationId);
        setDeleteConfirmationId(null);
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
      await updateTask(id, { status: newStatus as any });
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const loading = tasksLoading || workersLoading;
  const error = tasksError || workersError;

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

  const getWorkerName = (id?: string) => {
    if (!id) return 'Unassigned';
    const worker = workers.find(w => w.id === id);
    return worker ? worker.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tasks & Labor</h2>
      
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Task Board</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Add Task
              </button>
              <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">View All</button>
            </div>
        </div>
        <div className="p-6 space-y-4">
            {tasks.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tasks found.</p>
            ) : (
                tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                        <button 
                            onClick={() => handleToggleStatus(task.id, task.status)}
                            className="mt-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        >
                            {task.status === 'Completed' ? <CheckCircle className="text-green-600 dark:text-green-500" /> : <Circle />}
                        </button>
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <h4 className={`font-medium ${task.status === 'Completed' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>{task.title}</h4>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                      task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 
                                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' : 
                                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                  }`}>{task.priority === 'High' ? 'High' : task.priority === 'Medium' ? 'Medium' : 'Low'}</span>
                                  <div className="hidden group-hover:flex items-center gap-1">
                                    <button 
                                      onClick={() => handleEdit(task)}
                                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                      title="Edit"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(task.id)}
                                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                            </div>
                            {task.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {task.dueDate && (
                                    <span className="flex items-center gap-1"><Clock size={14} /> {format(parseISO(task.dueDate), 'MMM d')}</span>
                                )}
                                <span>Assigned to: {getWorkerName(task.assignedWorkerId)}</span>
                                <span className="capitalize">Status: {task.status === 'Completed' ? 'Completed' : 'Pending'}</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editingTaskId ? 'Edit Task' : 'Add New Task'}</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. Harvest Corn"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none h-24 resize-none"
                  placeholder="Optional details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to</label>
                <select
                  value={newTask.assignedWorkerId}
                  onChange={e => setNewTask({ ...newTask, assignedWorkerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">Unassigned</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>{worker.name} ({worker.role})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  {editingTaskId ? 'Save' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteConfirmationId}
        onClose={() => setDeleteConfirmationId(null)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
