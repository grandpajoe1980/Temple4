'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';
import Avatar from '@/app/components/ui/Avatar';
import UserLink from '@/app/components/ui/UserLink';
import MemberSelect, { MemberOption } from '@/app/components/ui/MemberSelect';
import { TaskWithDetails, TaskStatus, TaskPriority, TaskRecurrence, TenantSettings } from '@/types';

interface AdminWorkboardPageProps {
  tenantId: string;
}

const STATUS_COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'TODO', label: 'To Do', color: 'bg-slate-100' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100' },
  { key: 'REVIEW', label: 'Review', color: 'bg-yellow-100' },
  { key: 'DONE', label: 'Done', color: 'bg-green-100' },
];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'text-slate-500',
  NORMAL: 'text-blue-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600 font-semibold',
};

const RECURRENCE_LABELS: Record<TaskRecurrence, string> = {
  NONE: 'None',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

export default function AdminWorkboardPage({ tenantId }: AdminWorkboardPageProps) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('');
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
    priority: 'NORMAL' as TaskPriority,
    assigneeId: '',
    dueDate: '',
    recurrence: 'NONE' as TaskRecurrence,
    labels: [] as string[],
  });

  const [newComment, setNewComment] = useState('');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('view', view);
      if (search) params.set('search', search);
      if (filterPriority) params.set('priority', filterPriority);
      if (filterAssignee) params.set('assigneeId', filterAssignee);
      if (myTasksOnly) params.set('myTasks', 'true');

      const response = await fetch(`/api/tenants/${tenantId}/tasks?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, view, search, filterPriority, filterAssignee, myTasksOnly]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/admin/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [tenantId]);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/members?status=APPROVED&limit=1000`);
      if (response.ok) {
        const data = await response.json();
        const safeMembers = Array.isArray(data.members)
          ? data.members.map((m: any, idx: number) => {
              const id = m?.user?.id ?? m?.id ?? `unknown-${idx}`;
              const displayName = m?.user?.profile?.displayName ?? m?.user?.displayName ?? m?.displayName ?? 'Unknown';
              const avatarUrl = m?.user?.profile?.avatarUrl ?? m?.user?.avatarUrl ?? m?.avatarUrl;
              const roles = Array.isArray(m?.roles) ? m.roles.map((r: any) => r.role).filter(Boolean) : [];
              if (!m?.user?.id) {
                console.warn('AdminWorkboardPage: unexpected member shape', m);
              }
              return {
                id,
                displayName,
                avatarUrl,
                roles,
              };
            })
          : [];

        setMembers(safeMembers);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTasks();
    fetchSettings();
    fetchMembers();
  }, [fetchTasks, fetchSettings, fetchMembers]);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch(`/api/tenants/${tenantId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          assigneeId: newTask.assigneeId || null,
          dueDate: newTask.dueDate || null,
        }),
      });

      if (response.ok) {
        setAddModalOpen(false);
        setNewTask({
          title: '',
          description: '',
          status: 'TODO',
          priority: 'NORMAL',
          assigneeId: '',
          dueDate: '',
          recurrence: 'NONE',
          labels: [],
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/tenants/${tenantId}/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedTask.title,
          description: selectedTask.description,
          priority: selectedTask.priority,
          assigneeId: selectedTask.assigneeId || null,
          dueDate: selectedTask.dueDate,
          recurrence: selectedTask.recurrence,
          labels: selectedTask.labels,
        }),
      });

      if (response.ok) {
        setEditModalOpen(false);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tenants/${tenantId}/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDetailModalOpen(false);
        setSelectedTask(null);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) return;

    try {
      const response = await fetch(`/api/tenants/${tenantId}/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        // Refresh task details
        const taskResponse = await fetch(`/api/tenants/${tenantId}/tasks/${selectedTask.id}`);
        if (taskResponse.ok) {
          const updatedTask = await taskResponse.json();
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: TaskStatus) => {
    if (!draggedTask) return;

    const task = tasks.find((t) => t.id === draggedTask);
    if (task && task.status !== newStatus) {
      await handleStatusChange(draggedTask, newStatus);
    }
    setDraggedTask(null);
  };

  const openTaskDetail = async (task: TaskWithDetails) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/tasks/${task.id}`);
      if (response.ok) {
        const fullTask = await response.json();
        setSelectedTask(fullTask);
        setDetailModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  const handleToggleWorkboard = async (enabled: boolean) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableWorkboard: enabled }),
      });

      if (response.ok) {
        setSettings((prev) => prev ? { ...prev, enableWorkboard: enabled } : null);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((t) => t.status === status);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-slate-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workboard</h1>
          <p className="text-slate-600">Manage tasks and track progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setSettingsModalOpen(true)}>
            Settings
          </Button>
          <Button onClick={() => setAddModalOpen(true)}>+ Add Task</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select
            className="px-3 py-2 border border-slate-300 rounded-md"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TaskPriority | '')}
          >
            <option value="">All Priorities</option>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 border border-slate-300 rounded-md"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="">All Assignees</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.displayName}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={myTasksOnly}
              onChange={(e) => setMyTasksOnly(e.target.checked)}
              className="rounded"
            />
            My Tasks Only
          </label>

          <div className="flex border border-slate-300 rounded-md">
            <button
              className={`px-3 py-2 text-sm ${view === 'board' ? 'bg-slate-100' : ''}`}
              onClick={() => setView('board')}
            >
              Board
            </button>
            <button
              className={`px-3 py-2 text-sm border-l border-slate-300 ${view === 'list' ? 'bg-slate-100' : ''}`}
              onClick={() => setView('list')}
            >
              List
            </button>
          </div>
        </div>
      </Card>

      {/* Board View */}
      {view === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((column) => (
            <div
              key={column.key}
              className={`${column.color} rounded-lg p-4 min-h-[400px]`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.key)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">{column.label}</h3>
                <span className="text-sm text-slate-500 bg-white px-2 py-0.5 rounded-full">
                  {getTasksByStatus(column.key).length}
                </span>
              </div>

              <div className="space-y-3">
                {getTasksByStatus(column.key).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={() => openTaskDetail(task)}
                    className="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-slate-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-slate-900 text-sm">{task.title}</h4>
                      <span className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority === 'URGENT' && '🔴'}
                        {task.priority === 'HIGH' && '🟠'}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        {task.assignee && (
                          <div className="flex items-center gap-1">
                            <UserLink userId={task.assignee?.id}>
                              <Avatar
                                src={task.assignee?.avatarUrl}
                                name={task.assignee?.displayName}
                                size="xs"
                              />
                            </UserLink>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {task.dueDate && (
                          <span className={new Date(task.dueDate) < new Date() ? 'text-red-500' : ''}>
                            📅 {formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.commentCount && task.commentCount > 0 && (
                          <span>💬 {task.commentCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-3 text-sm font-medium text-slate-600">Task</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-600">Priority</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-600">Assignee</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-600">Due Date</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <button
                        onClick={() => openTaskDetail(task)}
                        className="text-left hover:text-blue-600"
                      >
                        <div className="font-medium text-slate-900">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-slate-500 line-clamp-1">{task.description}</div>
                        )}
                      </button>
                    </td>
                    <td className="p-3">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className="text-sm border border-slate-200 rounded px-2 py-1"
                      >
                        {STATUS_COLUMNS.map((col) => (
                          <option key={col.key} value={col.key}>{col.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <span className={`text-sm ${PRIORITY_COLORS[task.priority]}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </td>
                    <td className="p-3">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <UserLink userId={task.assignee?.id}>
                            <Avatar
                              src={task.assignee?.avatarUrl}
                              name={task.assignee?.displayName}
                              size="xs"
                            />
                          </UserLink>
                          <UserLink userId={task.assignee?.id} className="text-sm">
                            <span className="text-sm">{task.assignee.displayName}</span>
                          </UserLink>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3">
                      {task.dueDate ? (
                        <span className={`text-sm ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-slate-600'}`}>
                          {formatDate(task.dueDate)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { setSelectedTask(task); setEditModalOpen(true); }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleDeleteTask(task.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tasks.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks found</h3>
          <p className="text-slate-600 mb-4">Create your first task to get started.</p>
          <Button onClick={() => setAddModalOpen(true)}>Create Task</Button>
        </Card>
      )}

      {/* Add Task Modal */}
      <Modal isOpen={addModalOpen} title="Add New Task" onClose={() => setAddModalOpen(false)}>
        <div className="space-y-4">
          <Input
            label="Title *"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              rows={3}
              placeholder="Task description..."
              value={newTask.description}
              onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                value={newTask.priority}
                onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))}
              >
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
              <MemberSelect
                members={members}
                value={newTask.assigneeId}
                onChange={(value) => setNewTask((prev) => ({ ...prev, assigneeId: value }))}
                placeholder="Unassigned"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recurrence</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                value={newTask.recurrence}
                onChange={(e) => setNewTask((prev) => ({ ...prev, recurrence: e.target.value as TaskRecurrence }))}
              >
                {Object.entries(RECURRENCE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={!newTask.title.trim()}>Create Task</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Task Modal */}
      <Modal isOpen={editModalOpen} title="Edit Task" onClose={() => setEditModalOpen(false)}>
        {selectedTask && (
          <div className="space-y-4">
            <Input
              label="Title *"
              value={selectedTask.title}
              onChange={(e) => setSelectedTask((prev) => prev ? { ...prev, title: e.target.value } : null)}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                rows={3}
                value={selectedTask.description || ''}
                onChange={(e) => setSelectedTask((prev) => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  value={selectedTask.priority}
                  onChange={(e) => setSelectedTask((prev) => prev ? { ...prev, priority: e.target.value as TaskPriority } : null)}
                >
                  {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                <MemberSelect
                  members={members}
                  value={selectedTask.assigneeId || ''}
                  onChange={(value) => setSelectedTask((prev) => prev ? { ...prev, assigneeId: value || null } : null)}
                  placeholder="Unassigned"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateTask}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Task Detail Modal */}
      <Modal isOpen={detailModalOpen} title={selectedTask?.title || 'Task Details'} onClose={() => setDetailModalOpen(false)}>
        {selectedTask && (
          <div className="space-y-6">
            {/* Task Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-sm ${PRIORITY_COLORS[selectedTask.priority]}`}>
                  {PRIORITY_LABELS[selectedTask.priority]} Priority
                </span>
                <span className="text-sm text-slate-500">
                  Created by {selectedTask.createdBy.displayName}
                </span>
              </div>

              {selectedTask.description && (
                <p className="text-slate-600">{selectedTask.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                {selectedTask.assignee && (
                  <div>
                    <span className="text-slate-500">Assignee:</span>{' '}
                    <span className="font-medium">{selectedTask.assignee.displayName}</span>
                  </div>
                )}
                {selectedTask.dueDate && (
                  <div>
                    <span className="text-slate-500">Due:</span>{' '}
                    <span className={new Date(selectedTask.dueDate) < new Date() ? 'text-red-500 font-medium' : 'font-medium'}>
                      {formatDate(selectedTask.dueDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-slate-200 pt-4">
              <h4 className="font-medium text-slate-900 mb-3">Comments</h4>
              
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {selectedTask.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <UserLink userId={comment.author?.id}>
                      <Avatar src={comment.author?.avatarUrl} name={comment.author?.displayName} size="sm" />
                    </UserLink>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <UserLink userId={comment.author?.id} className="font-medium text-sm">
                          <span className="font-medium text-sm">{comment.author.displayName}</span>
                        </UserLink>
                        <span className="text-xs text-slate-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{comment.content}</p>
                    </div>
                  </div>
                ))}
                {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                  <p className="text-sm text-slate-400">No comments yet.</p>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  Post
                </Button>
              </div>
            </div>

            {/* Activity Log */}
            {selectedTask.activities && selectedTask.activities.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-medium text-slate-900 mb-3">Activity</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto text-sm">
                  {selectedTask.activities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-2 text-slate-500">
                      <span className="font-medium text-slate-700">{activity.user.displayName}</span>
                      <span>{activity.action.replace(/_/g, ' ')}</span>
                      {activity.newValue && <span className="text-slate-700">→ {activity.newValue}</span>}
                      <span className="text-xs text-slate-400">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-200">
              <Button variant="secondary" onClick={() => handleDeleteTask(selectedTask.id)}>
                Delete Task
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setEditModalOpen(true); setDetailModalOpen(false); }}>
                  Edit
                </Button>
                <Button onClick={() => setDetailModalOpen(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={settingsModalOpen} title="Workboard Settings" onClose={() => setSettingsModalOpen(false)}>
        <div className="space-y-6">
          <ToggleSwitch
            label="Enable Workboard"
            description="Allow members to view and manage tasks"
            enabled={settings?.enableWorkboard ?? true}
            onChange={handleToggleWorkboard}
          />

          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-medium text-slate-900 mb-3">Default Columns</h4>
            <p className="text-sm text-slate-500 mb-3">
              The workboard uses the following default columns: To Do, In Progress, Review, Done
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setSettingsModalOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

