import { useState, useEffect } from 'react';
import { fetchJson } from '../api/client';

export interface FarmTask {
  id: string;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  dueDate?: string;
  assignedWorkerId?: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<FarmTask[]>('/tasks')
      .then(setTasks)
      .catch(err => {
        console.error('Failed to fetch tasks:', err);
        setError('Failed to load tasks.');
      })
      .finally(() => setLoading(false));
  }, []);

  const addTask = async (task: Omit<FarmTask, 'id'>) => {
    try {
      const newTask = await fetchJson<FarmTask>('/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      console.error('Failed to add task:', err);
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<FarmTask>) => {
    try {
      const taskToUpdate = tasks.find(t => t.id === id);
      if (!taskToUpdate) throw new Error('Task not found');

      const updatedTask = await fetchJson<FarmTask>(`/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...taskToUpdate, ...updates }),
      });

      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
      return updatedTask;
    } catch (err) {
      console.error('Failed to update task:', err);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await fetchJson(`/tasks/${id}`, {
        method: 'DELETE',
      });
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
      throw err;
    }
  };

  return { tasks, loading, error, addTask, updateTask, deleteTask };
}
