import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus } from 'lucide-react';

type AddTaskProps = {
  onNavigateToList: () => void;
};

export default function AddTask({ onNavigateToList }: AddTaskProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<'new' | 'in_progress' | 'completed'>('new');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user) {
      setError('You must be logged in to create a task');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('tasks').insert([
      {
        user_id: user.id,
        title,
        description,
        deadline,
        status,
      },
    ]);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onNavigateToList();
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

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
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Add New Task</h1>
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
                min={getMinDateTime()}
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
                {loading ? 'Creating...' : 'Create Task'}
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
