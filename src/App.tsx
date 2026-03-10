import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import TaskList from './pages/TaskList';
import AddTask from './pages/AddTask';
import EditTask from './pages/EditTask';

type Page = 'login' | 'register' | 'tasks' | 'add-task' | 'edit-task';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [editingTaskId, setEditingTaskId] = useState<string>('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <p className="text-slate-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'register') {
      return <Register onNavigateToLogin={() => setCurrentPage('login')} />;
    }
    return <Login onNavigateToRegister={() => setCurrentPage('register')} />;
  }

  if (currentPage === 'add-task') {
    return <AddTask onNavigateToList={() => setCurrentPage('tasks')} />;
  }

  if (currentPage === 'edit-task' && editingTaskId) {
    return (
      <EditTask
        taskId={editingTaskId}
        onNavigateToList={() => {
          setCurrentPage('tasks');
          setEditingTaskId('');
        }}
      />
    );
  }

  return (
    <TaskList
      onNavigateToAdd={() => setCurrentPage('add-task')}
      onNavigateToEdit={(taskId) => {
        setEditingTaskId(taskId);
        setCurrentPage('edit-task');
      }}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
