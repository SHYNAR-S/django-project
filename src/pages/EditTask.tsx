import { useState, useEffect, FormEvent } from 'react';
import { supabase, Task } from '../lib/supabase';
import { ArrowLeft, CreditCard as Edit } from 'lucide-react';

type EditTaskProps = {
  taskId: string;
  onNavigateToList: () => void;
};

export default function EditTask({ taskId, onNavigateToList }: EditTaskProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<'new' | 'in_progress' | 'completed'>('new');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingTask, setFetchingTask] = useState(true);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    setFetchingTask(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    if (error) {
      setError('Failed to load task');
      setFetchingTask(false);
      return;
    }

    if (data) {
      setTask(data);
      setTitle(data.title);
      setDescription(data.description);
      setDeadline(new Date(data.deadline).toISOString().slice(0, 16));
      setStatus(data.status);
    } else {
      setError('Task not found');
    }

    setFetchingTask(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase
      .from('tasks')
      .update({
        title,
        description,
        deadline,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onNavigateToList();
    }
  };

  if (fetchingTask) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <p className="text-slate-600">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onNavigateToList}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onNavigateToList}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Tasks
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-500 p-3 rounded-xl">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Edit Task</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                placeholder="Enter task description (optional)"
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-slate-700 mb-2">
                Deadline <span className="text-red-500">*</span>
              </label>
              <input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'new' | 'in_progress' | 'completed')}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={onNavigateToList}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
