import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Task } from '../lib/supabase';
import { Plus, CreditCard as Edit, Trash2, LogOut, Filter, ArrowUpDown } from 'lucide-react';

type TaskListProps = {
  onNavigateToAdd: () => void;
  onNavigateToEdit: (taskId: string) => void;
};

export default function TaskList({ onNavigateToAdd, onNavigateToEdit }: TaskListProps) {
  const { user, signOut } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [sortBy, setSortBy] = useState<'deadline' | 'created'>('deadline');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('deadline', { ascending: true });

    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (!error) {
      setTasks(tasks.filter((task) => task.id !== id));
    }
  };

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDeadline < 0) {
      return 'overdue';
    } else if (hoursUntilDeadline <= 24) {
      return 'urgent';
    }
    return 'normal';
  };

  const getFilteredAndSortedTasks = () => {
    let filtered = [...tasks];

    if (filterStatus !== 'all') {
      filtered = filtered.filter((task) => task.status === filterStatus);
    }

    if (filterOverdue) {
      filtered = filtered.filter((task) => getDeadlineStatus(task.deadline) === 'overdue');
    }

    if (sortBy === 'deadline') {
      filtered.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered;
  };

  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-slate-100 text-slate-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const filteredTasks = getFilteredAndSortedTasks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-800">My Tasks</h1>
              <p className="text-slate-600 mt-1">
                Welcome back, {user?.user_metadata?.username || user?.email}
              </p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-600" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <button
              onClick={() => setFilterOverdue(!filterOverdue)}
              className={`px-4 py-2 rounded-lg border transition ${
                filterOverdue
                  ? 'bg-red-500 text-white border-red-500'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {filterOverdue ? 'Showing Overdue Only' : 'Show Overdue Only'}
            </button>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-slate-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'deadline' | 'created')}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="deadline">Sort by Deadline</option>
                <option value="created">Sort by Created</option>
              </select>
            </div>

            <button
              onClick={onNavigateToAdd}
              className="ml-auto flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <p className="text-slate-600">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <p className="text-slate-600 mb-4">
              {tasks.length === 0 ? 'No tasks yet. Create your first task!' : 'No tasks match your filters.'}
            </p>
            {tasks.length === 0 && (
              <button
                onClick={onNavigateToAdd}
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Add Your First Task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const deadlineStatus = getDeadlineStatus(task.deadline);
              let cardClass = 'bg-white';

              if (deadlineStatus === 'overdue') {
                cardClass = 'bg-red-50 border-2 border-red-300';
              } else if (deadlineStatus === 'urgent') {
                cardClass = 'bg-yellow-50 border-2 border-yellow-300';
              }

              return (
                <div
                  key={task.id}
                  className={`${cardClass} rounded-xl shadow-md p-6 transition hover:shadow-lg`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-slate-800">{task.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-slate-600 mb-3">{task.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="font-medium">
                          Deadline: {formatDeadline(task.deadline)}
                        </span>
                        {deadlineStatus === 'overdue' && (
                          <span className="text-red-600 font-semibold">OVERDUE</span>
                        )}
                        {deadlineStatus === 'urgent' && (
                          <span className="text-yellow-700 font-semibold">DUE SOON</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => onNavigateToEdit(task.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
