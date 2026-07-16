'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  FileClock, 
  Edit2, 
  Key, 
  UserPlus, 
  Search, 
  Filter, 
  Calendar,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { updateUser, resetUserPassword } from '@/app/actions/user';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  slug: string;
  nameHi: string;
  nameEn: string;
  designationHi: string | null;
  designationEn: string | null;
  departmentHi: string;
  departmentEn: string;
  phone: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  createdAt: Date;
}

interface ActivityLog {
  id: number;
  userId: number | null;
  tenderId: number | null;
  action: string;
  details: any;
  createdAt: Date;
  userEmail: string | null;
  userName: string | null;
}

interface AdminDashboardProps {
  initialUsers: User[];
  initialLogs: ActivityLog[];
  currentUser: {
    id: string;
    email: string;
    role: string;
  };
}

export default function AdminDashboard({ initialUsers, initialLogs, currentUser }: AdminDashboardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [usersList, setUsersList] = useState<User[]>(initialUsers);
  
  // Modals state
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit User Form State
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameHi, setEditNameHi] = useState('');
  const [editDesignationEn, setEditDesignationEn] = useState('');
  const [editDesignationHi, setEditDesignationHi] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'superuser' | 'guest'>('user');

  // Logs Filter State
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Open Edit User dialog
  const openEditModal = (user: User) => {
    setEditUser(user);
    setEditNameEn(user.nameEn);
    setEditNameHi(user.nameHi);
    setEditDesignationEn(user.designationEn || '');
    setEditDesignationHi(user.designationHi || '');
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditRole(user.role as any);
  };

  // Close Edit User dialog
  const closeEditModal = () => {
    setEditUser(null);
  };

  // Handle Edit User Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsSaving(true);
    try {
      const res = await updateUser({
        id: editUser.id,
        nameEn: editNameEn,
        nameHi: editNameHi,
        designationEn: editDesignationEn || null,
        designationHi: editDesignationHi || null,
        phone: editPhone,
        email: editEmail,
        role: editRole,
      });

      if (res.success) {
        toast('User details updated successfully', 'success');
        closeEditModal();
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update user', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (userId: number) => {
    setIsSaving(true);
    try {
      const res = await resetUserPassword(userId);
      if (res.success && res.tempPassword) {
        setGeneratedPassword(res.tempPassword);
        toast('Password reset successful', 'success');
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to reset password', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to map log action keys to clean labels
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'bidder.create': 'Added Bidder',
      'bidder.update': 'Updated Bidder Details',
      'bidder.delete': 'Deleted Bidder',
      'status.update': 'Updated Compliance Cell',
      'checklist_item.create': 'Added Checklist Item',
      'checklist_item.rename': 'Renamed Checklist Item',
      'checklist_item.category_change': 'Checklist Item Category Reset',
      'checklist_item.delete': 'Deleted Checklist Item',
      'tender.update': 'Updated Tender Settings',
      'account.update_email': 'Updated Profile Email',
      'account.update_password': 'Changed Password',
      'account.update_phone': 'Updated Profile Phone',
      'admin.update_user': 'Admin: Updated User Details',
      'admin.reset_user_password': 'Admin: Reset User Password',
    };
    return labels[action] || action;
  };

  // Helper to format detail summary
  const getLogDetailSummary = (log: ActivityLog) => {
    const details = log.details || {};
    switch (log.action) {
      case 'bidder.create':
        return `Name: "${details.bidderName}", Email: ${details.email}`;
      case 'bidder.update':
        return `Updated "${details.oldName}" -> "${details.newName}"`;
      case 'bidder.delete':
        return `Removed bidder "${details.bidderName}"`;
      case 'status.update':
        return `Set status of "${details.bidderName}" for "${details.checklistItemLabel}" from "${details.oldValue}" to "${details.newValue}"`;
      case 'checklist_item.create':
        return `Label: "${details.label}", Category: ${details.category}`;
      case 'checklist_item.rename':
        return `Renamed "${details.oldLabel}" -> "${details.newLabel}"`;
      case 'checklist_item.category_change':
        return `Changed category of "${details.label}" from "${details.oldCategory}" to "${details.newCategory}" (statuses reset to ${details.statusResetTo})`;
      case 'checklist_item.delete':
        return `Deleted checklist item "${details.label}"`;
      case 'tender.update':
        return `Updated Tender: "${details.oldName}" -> "${details.newName}"`;
      case 'admin.update_user':
        return `Updated user account ${details.targetEmail}`;
      case 'admin.reset_user_password':
        return `Reset password for user ${details.targetEmail}`;
      default:
        return JSON.stringify(details);
    }
  };

  // Filter logs client-side
  const filteredLogs = useMemo(() => {
    return initialLogs.filter(log => {
      // 1. User Filter
      if (selectedUserFilter !== 'all' && log.userEmail !== selectedUserFilter) {
        return false;
      }

      // 2. Text Search Query
      if (logSearchQuery) {
        const query = logSearchQuery.toLowerCase();
        const actionLabel = getActionLabel(log.action).toLowerCase();
        const userName = (log.userName || '').toLowerCase();
        const userEmail = (log.userEmail || '').toLowerCase();
        const details = JSON.stringify(log.details).toLowerCase();

        if (
          !actionLabel.includes(query) &&
          !userName.includes(query) &&
          !userEmail.includes(query) &&
          !details.includes(query)
        ) {
          return false;
        }
      }

      // 3. Date Filters
      const logDate = new Date(log.createdAt);
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (logDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (logDate > to) return false;
      }

      return true;
    });
  }, [initialLogs, selectedUserFilter, logSearchQuery, dateFrom, dateTo]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950">
      
      {/* Admin Subheader / Tabs */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              activeTab === 'users'
                ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Users size={14} />
            User Management
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              activeTab === 'logs'
                ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <FileClock size={14} />
            Audit Logging
          </button>
        </div>

        <div className="text-xs text-rose-500 font-extrabold uppercase bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
          Superuser Access Enabled
        </div>
      </div>

      {/* Main Admin Workspace */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto h-full">

          {/* USER MANAGEMENT TAB */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-full">
              <div className="p-5 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  Active Department Accounts ({usersList.length})
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  View, edit, and reset credentials for departmental materials team members.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-55 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                      <th className="p-4 font-semibold">User Details</th>
                      <th className="p-4 font-semibold">Designation (English / Hindi)</th>
                      <th className="p-4 font-semibold">Contact</th>
                      <th className="p-4 font-semibold">Role</th>
                      <th className="p-4 font-semibold">Password State</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                        <td className="p-4">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{user.nameEn}</span>
                            <span className="text-[10px] text-slate-500 block">{user.nameHi}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-slate-700 dark:text-zinc-300 block">{user.designationEn || 'N/A'}</span>
                          <span className="text-[10px] text-slate-500 block">{user.designationHi || 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-slate-700 dark:text-zinc-300 block font-medium">{user.email}</span>
                          <span className="text-slate-500 block">{user.phone || 'No Tel'}</span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            user.role === 'superuser'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                              : user.role === 'guest'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          {user.mustChangePassword ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-500 font-semibold">
                              <XCircle size={12} /> Force Reset Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-semibold">
                              <CheckCircle size={12} /> Active
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-1.5 border border-slate-200 dark:border-zinc-700 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-250 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                              title="Edit User Details"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => {
                                setResettingUser(user);
                                setGeneratedPassword(null);
                              }}
                              className="p-1.5 border border-slate-200 dark:border-zinc-700 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-250 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                              title="Reset Password"
                            >
                              <Key size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AUDIT LOGGING TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-4 h-full flex flex-col">
              
              {/* Log Filters Toolbar */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800/50 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Filter size={14} />
                  </span>
                  <select
                    value={selectedUserFilter}
                    onChange={(e) => setSelectedUserFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800/50 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-850 dark:text-zinc-300 cursor-pointer"
                  >
                    <option value="all">All Users</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.email}>{u.nameEn} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Calendar size={14} />
                  </span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800/50 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white cursor-pointer"
                    title="From Date"
                  />
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Calendar size={14} />
                  </span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800/50 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white cursor-pointer"
                    title="To Date"
                  />
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 max-h-[calc(100vh-320px)]">
                <div className="overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-55 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm">
                        <th className="p-4 font-semibold w-40">Timestamp</th>
                        <th className="p-4 font-semibold w-48">Operator</th>
                        <th className="p-4 font-semibold w-48">Action</th>
                        <th className="p-4 font-semibold">Activity Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-zinc-500">
                            No matching audit logs found.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                            <td className="p-4 font-medium text-slate-500 dark:text-zinc-400">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                {log.userName || 'System Action'}
                              </span>
                              <span className="text-[10px] text-slate-550 block">
                                {log.userEmail || ''}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-slate-800 dark:text-zinc-300">
                              {getActionLabel(log.action)}
                            </td>
                            <td className="p-4 text-slate-600 dark:text-zinc-400 leading-relaxed font-mono text-[10px]">
                              {getLogDetailSummary(log)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* EDIT USER DIALOG MODAL */}
      <Dialog
        isOpen={editUser !== null}
        onClose={closeEditModal}
        title={`Edit Details for ${editUser?.nameEn}`}
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Name (English)</label>
              <input
                type="text"
                required
                value={editNameEn}
                onChange={(e) => setEditNameEn(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Name (Hindi)</label>
              <input
                type="text"
                required
                value={editNameHi}
                onChange={(e) => setEditNameHi(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Designation (English)</label>
              <input
                type="text"
                value={editDesignationEn}
                onChange={(e) => setEditDesignationEn(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Designation (Hindi)</label>
              <input
                type="text"
                value={editDesignationHi}
                onChange={(e) => setEditDesignationHi(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Email Address</label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">Phone Number</label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block">System Access Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as any)}
              className="w-full text-xs p-2 bg-slate-50 dark:bg-zinc-800 text-slate-850 dark:text-zinc-350 border border-slate-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="user">User (Standard Materials Officer)</option>
              <option value="superuser">Superuser (Department Administrator)</option>
              <option value="guest">Guest (ReadOnly / Drafts Only)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={closeEditModal}
              className="px-4 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving && <Loader2 size={12} className="animate-spin" />}
              Save Details
            </button>
          </div>
        </form>
      </Dialog>

      {/* PASSWORD RESET DIALOG MODAL */}
      <Dialog
        isOpen={resettingUser !== null}
        onClose={() => {
          setResettingUser(null);
          setGeneratedPassword(null);
        }}
        title="Reset User Password"
        size="sm"
      >
        <div className="space-y-4">
          {!generatedPassword ? (
            <>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Are you sure you want to reset the password for user <strong>{resettingUser?.nameEn}</strong> ({resettingUser?.email})?
              </p>
              <p className="text-xs text-amber-500 font-bold bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-lg">
                ⚠️ Resetting forces a random temporary password and sets `mustChangePassword = true`. The user will be locked into the My Account screen on their next login until they update it.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResetPassword(resettingUser!.id)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-550 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving && <Loader2 size={12} className="animate-spin" />}
                  Confirm Reset
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Password reset completed. Copy the temporary password below:
              </p>
              <div className="bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 p-4 rounded-lg flex items-center justify-between">
                <code className="text-sm font-bold text-rose-600 select-all tracking-wider font-mono">
                  {generatedPassword}
                </code>
                <span className="text-[9px] uppercase font-extrabold text-slate-400">
                  Single Use Password
                </span>
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Provide this temporary password to <strong>{resettingUser?.nameEn}</strong> out-of-band. Do not commit this to files or logs.
              </p>
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    setResettingUser(null);
                    setGeneratedPassword(null);
                  }}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </Dialog>

    </div>
  );
}
