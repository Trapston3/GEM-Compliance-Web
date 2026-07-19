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
  FolderKanban,
  Plus,
  Trash2,
  FileText,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { Dialog, Button, Badge, Card, Input, Select, Tabs } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { updateUser, resetUserPassword, createUser, deleteUser } from '@/app/actions/user';
import { createChecklistTemplate, updateChecklistTemplate, deleteChecklistTemplate, getChecklistTemplates } from '@/app/actions/template';
import { reassignTenderOwner } from '@/app/actions/tender';
import { useRouter } from 'next/navigation';
import ChecklistEditor, { ChecklistEditorItem } from '@/components/ChecklistEditor';

interface User {
  id: number;
  slug: string;
  nameHi: string;
  nameEn: string;
  designationHi: string | null;
  designationEn: string | null;
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

interface AdminTender {
  id: number;
  name: string;
  subjectLine: string | null;
  ownerId: number;
  ownerName: string;
  status: 'active' | 'archived';
  createdAt: Date;
  bidderCount: number;
}

interface Template {
  id: number;
  name: string;
  description: string | null;
  isDefault?: boolean;
}

interface AdminDashboardProps {
  initialUsers: User[];
  initialLogs: ActivityLog[];
  initialTenders: AdminTender[];
  initialTemplates?: Template[];
  currentUser: {
    id: string;
    email: string;
    role: string;
  };
}

export default function AdminDashboard({
  initialUsers,
  initialLogs,
  initialTenders,
  initialTemplates = [],
  currentUser,
}: AdminDashboardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'tenders' | 'templates' | 'logs'>('users');
  const [usersList, setUsersList] = useState<User[]>(initialUsers);
  
  // User Modal states
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [reassignOwnerId, setReassignOwnerId] = useState<string>('');
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

  // Create User Form State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addNameEn, setAddNameEn] = useState('');
  const [addNameHi, setAddNameHi] = useState('');
  const [addDesignationEn, setAddDesignationEn] = useState('');
  const [addDesignationHi, setAddDesignationHi] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addRole, setAddRole] = useState<'user' | 'superuser' | 'guest'>('user');
  const [createdUserPass, setCreatedUserPass] = useState<string | null>(null);
  const [createdUserName, setCreatedUserName] = useState('');

  // Checklist Templates State
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateItems, setTemplateItems] = useState<ChecklistEditorItem[]>([]);

  // Logs Filter State
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedTenderFilter, setSelectedTenderFilter] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');

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
        toast('User details updated', 'success');
        setEditUser(null);
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update user', 'error');
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await createUser({
        nameEn: addNameEn,
        nameHi: addNameHi,
        designationEn: addDesignationEn || null,
        designationHi: addDesignationHi || null,
        phone: addPhone,
        email: addEmail,
        role: addRole,
      });

      if (res.success && res.tempPassword) {
        setCreatedUserPass(res.tempPassword);
        setCreatedUserName(addNameEn);
        toast('User created successfully', 'success');
        
        setAddNameEn('');
        setAddNameHi('');
        setAddDesignationEn('');
        setAddDesignationHi('');
        setAddEmail('');
        setAddPhone('');
        setAddRole('user');
        setIsAddingUser(false);
        router.refresh();
        const { getUsers } = await import('@/app/actions/user');
        setUsersList(await getUsers());
      }
    } catch (err: any) {
      toast(err.message || 'Failed to create user', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUserSubmit = async () => {
    if (!deletingUser) return;
    setIsSaving(true);
    try {
      await deleteUser(deletingUser.id, reassignOwnerId ? Number(reassignOwnerId) : undefined);
      toast('User deleted successfully', 'success');
      setDeletingUser(null);
      setReassignOwnerId('');
      router.refresh();
      const { getUsers } = await import('@/app/actions/user');
      setUsersList(await getUsers());
    } catch (err: any) {
      toast(err.message || 'Failed to delete user', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (templateItems.length === 0) {
      toast('Please add at least one criteria item to the template', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const res = await createChecklistTemplate({
        name: templateName,
        description: templateDescription || null,
        items: templateItems.map((item, idx) => ({
          label: item.label,
          category: item.category,
          groupOrder: item.groupOrder,
          sortOrder: idx + 1,
        })),
      });

      if (res.success) {
        toast('Template created successfully', 'success');
        setIsAddingTemplate(false);
        setTemplateName('');
        setTemplateDescription('');
        setTemplateItems([]);
        router.refresh();
        setTemplates(await getChecklistTemplates());
      }
    } catch (err: any) {
      toast(err.message || 'Failed to create template', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditTemplateModal = async (template: Template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setIsSaving(true);
    try {
      const { getChecklistTemplate } = await import('@/app/actions/template');
      const details = await getChecklistTemplate(template.id);
      if (details) {
        setTemplateItems(details.items || []);
      }
    } catch (err) {
      toast('Failed to load template items', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    if (templateItems.length === 0) {
      toast('Please add at least one criteria item to the template', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const res = await updateChecklistTemplate(editingTemplate.id, {
        name: templateName,
        description: templateDescription || null,
        items: templateItems.map((item, idx) => ({
          label: item.label,
          category: item.category,
          groupOrder: item.groupOrder,
          sortOrder: idx + 1,
        })),
      });

      if (res.success) {
        toast('Template updated (archived prior version if default)', 'success');
        setEditingTemplate(null);
        setTemplateName('');
        setTemplateDescription('');
        setTemplateItems([]);
        router.refresh();
        setTemplates(await getChecklistTemplates());
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update template', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplateSubmit = async () => {
    if (!deletingTemplate) return;
    setIsSaving(true);
    try {
      const res = await deleteChecklistTemplate(deletingTemplate.id);
      if (res.success) {
        toast('Template deleted successfully', 'success');
        setDeletingTemplate(null);
        router.refresh();
        setTemplates(await getChecklistTemplates());
      }
    } catch (err: any) {
      toast(err.message || 'Failed to delete template', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'bidder.create': 'Added Bidder',
      'bidder.update': 'Updated Bidder Details',
      'bidder.delete': 'Deleted Bidder',
      'bidder.bulk_import': 'Bulk Imported Bidders',
      'status.update': 'Updated Compliance Cell',
      'checklist_item.create': 'Added Checklist Item',
      'checklist_item.rename': 'Renamed Checklist Item',
      'checklist_item.delete': 'Deleted Checklist Item',
      'tender.update': 'Updated Tender Settings',
      'account.update_email': 'Updated Profile Email',
      'account.update_password': 'Changed Password',
      'admin.create_user': 'Admin: Created User Account',
      'admin.update_user': 'Admin: Updated User Details',
      'admin.delete_user': 'Admin: Deleted User Account',
      'admin.reset_user_password': 'Admin: Reset User Password',
      'template.create': 'Created Checklist Template',
      'template.update': 'Updated Checklist Template',
      'template.version_archived': 'Archived Template Version',
    };
    return labels[action] || action;
  };

  const filteredLogs = useMemo(() => {
    return initialLogs.filter(log => {
      if (selectedUserFilter !== 'all' && log.userEmail !== selectedUserFilter) return false;
      if (selectedTenderFilter !== 'all' && String(log.tenderId) !== selectedTenderFilter) return false;
      if (logSearchQuery) {
        const q = logSearchQuery.toLowerCase();
        const actionLabel = getActionLabel(log.action).toLowerCase();
        const details = JSON.stringify(log.details).toLowerCase();
        if (!actionLabel.includes(q) && !details.includes(q)) return false;
      }
      return true;
    });
  }, [initialLogs, selectedUserFilter, selectedTenderFilter, logSearchQuery]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)]">
      {/* Navigation Subheader */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] p-3 sm:px-6 sm:py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <Tabs
          active={activeTab}
          onChange={(id) => setActiveTab(id as any)}
          items={[
            { id: 'users', label: 'User Accounts', icon: Users },
            { id: 'tenders', label: 'All Tenders', icon: FolderKanban },
            { id: 'templates', label: 'Checklist Templates', icon: FileText },
            { id: 'logs', label: 'Audit Logs', icon: FileClock },
          ]}
        />
        <Badge tone="danger">Superuser Access Enabled</Badge>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="max-w-7xl mx-auto h-full space-y-6">

          {/* USER ACCOUNTS TAB */}
          {activeTab === 'users' && (
            <Card className="overflow-hidden">
              <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    Department User Accounts ({usersList.length})
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Manage team member credentials, assign roles, reset passwords, or remove user accounts.
                  </p>
                </div>
                <Button onClick={() => setIsAddingUser(true)}>
                  <UserPlus size={16} /> Add User
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] font-bold text-[var(--text-secondary)]">
                      <th className="p-4">User Name</th>
                      <th className="p-4">Designation</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-[var(--text-primary)] block">{user.nameEn}</span>
                          <span className="text-[10px] text-[var(--text-muted)] block">{user.nameHi}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-[var(--text-secondary)] block">{user.designationEn || 'N/A'}</span>
                          <span className="text-[10px] text-[var(--text-muted)] block">{user.designationHi || 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-[var(--text-secondary)] font-medium block">{user.email}</span>
                          <span className="text-[var(--text-muted)] block">{user.phone}</span>
                        </td>
                        <td className="p-4">
                          <Badge tone={user.role === 'superuser' ? 'danger' : user.role === 'guest' ? 'neutral' : 'note'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {user.mustChangePassword ? (
                            <span className="inline-flex items-center gap-1 text-[var(--status-warning-text)] font-semibold">
                              <XCircle size={13} /> Reset Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[var(--status-success-text)] font-semibold">
                              <CheckCircle size={13} /> Active
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="p-1.5 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-[var(--radius-sm)] cursor-pointer"
                              title="Edit User"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetPassword(user.id)}
                              className="p-1.5 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-[var(--radius-sm)] cursor-pointer"
                              title="Reset Password"
                            >
                              <Key size={13} />
                            </button>
                            {user.email !== currentUser.email && (
                              <button
                                type="button"
                                onClick={() => setDeletingUser(user)}
                                className="p-1.5 border border-[var(--status-danger)]/30 text-[var(--status-danger-text)] hover:bg-[var(--status-danger-bg)] rounded-[var(--radius-sm)] cursor-pointer"
                                title="Remove User Account"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TENDERS TAB */}
          {activeTab === 'tenders' && (
            <Card className="overflow-hidden">
              <div className="p-5 border-b border-[var(--border-subtle)]">
                <h3 className="font-bold text-sm text-[var(--text-primary)]">All System Tenders ({initialTenders.length})</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">Reassign tender ownership or inspect tender statistics.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] font-bold text-[var(--text-secondary)]">
                      <th className="p-4">Tender Name</th>
                      <th className="p-4">Owner Account</th>
                      <th className="p-4">Bidders</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {initialTenders.map(t => (
                      <tr key={t.id} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                        <td className="p-4">
                          <a href={`/tenders/${t.id}/overview`} className="font-bold text-[var(--brand-primary)] hover:underline">
                            {t.name}
                          </a>
                        </td>
                        <td className="p-4">
                          <Select
                            value={t.ownerId}
                            onChange={async (e) => {
                              try {
                                await reassignTenderOwner(t.id, Number(e.target.value));
                                toast('Tender owner updated', 'success');
                                router.refresh();
                              } catch (err: any) {
                                toast(err.message, 'error');
                              }
                            }}
                          >
                            {usersList.map(u => (
                              <option key={u.id} value={u.id}>{u.nameEn}</option>
                            ))}
                          </Select>
                        </td>
                        <td className="p-4 font-bold">{t.bidderCount}</td>
                        <td className="p-4">
                          <Badge tone={t.status === 'active' ? 'success' : 'neutral'}>
                            {t.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <a href={`/tenders/${t.id}/settings`} className="text-[var(--brand-primary)] hover:underline font-semibold">
                            Manage
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* CHECKLIST TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <Card className="overflow-hidden space-y-4 p-5">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    Master Checklist Templates ({templates.length})
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Manage reusable verification profiles for tender creation. Modifying the active default template creates a new version while archiving prior versions.
                  </p>
                </div>
                <Button onClick={() => {
                  setTemplateName('');
                  setTemplateDescription('');
                  setTemplateItems([]);
                  setIsAddingTemplate(true);
                }}>
                  <Plus size={16} /> New Template
                </Button>
              </div>

              {templates.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                  No checklist templates found. Create a master template to get started.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {templates.map((template) => (
                    <div key={template.id} className="py-4 flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[var(--text-primary)]">{template.name}</h4>
                          {template.isDefault && <Badge tone="success">Active Default</Badge>}
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          {template.description || 'No description provided'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="secondary" size="sm" onClick={() => openEditTemplateModal(template)}>
                          <Edit2 size={13} /> Edit Template
                        </Button>
                        {!template.isDefault && (
                          <Button variant="danger" size="sm" onClick={() => setDeletingTemplate(template)}>
                            <Trash2 size={13} /> Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* AUDIT LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <Card className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input
                  placeholder="Search logs..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                />
                <Select value={selectedTenderFilter} onChange={(e) => setSelectedTenderFilter(e.target.value)}>
                  <option value="all">All Tenders</option>
                  {initialTenders.map(t => (
                    <option key={t.id} value={String(t.id)}>{t.name}</option>
                  ))}
                </Select>
                <Select value={selectedUserFilter} onChange={(e) => setSelectedUserFilter(e.target.value)}>
                  <option value="all">All Users</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.email}>{u.nameEn}</option>
                  ))}
                </Select>
              </Card>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] font-bold text-[var(--text-secondary)]">
                        <th className="p-4 w-40">Timestamp</th>
                        <th className="p-4 w-48">User</th>
                        <th className="p-4 w-48">Action</th>
                        <th className="p-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-[var(--text-muted)]">
                            No matching audit logs found.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                            <td className="p-4 text-[var(--text-muted)]">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <strong className="text-[var(--text-primary)] block">{log.userName || 'System'}</strong>
                              <span className="text-[10px] text-[var(--text-muted)] block">{log.userEmail || ''}</span>
                            </td>
                            <td className="p-4 font-semibold text-[var(--text-primary)]">
                              {getActionLabel(log.action)}
                            </td>
                            <td className="p-4 font-mono text-[11px] text-[var(--text-muted)]">
                              {JSON.stringify(log.details)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* CREATE USER MODAL */}
      <Dialog isOpen={isAddingUser} onClose={() => setIsAddingUser(false)} title="Add New User Account" size="md">
        <form onSubmit={handleAddUserSubmit} className="space-y-4">
          <Input label="English Name" required value={addNameEn} onChange={(e) => setAddNameEn(e.target.value)} />
          <Input label="Hindi Name" required value={addNameHi} onChange={(e) => setAddNameHi(e.target.value)} />
          <Input label="English Designation" value={addDesignationEn} onChange={(e) => setAddDesignationEn(e.target.value)} />
          <Input label="Hindi Designation" value={addDesignationHi} onChange={(e) => setAddDesignationHi(e.target.value)} />
          <Input label="Email Address" type="email" required value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
          <Input label="Phone Number" required value={addPhone} onChange={(e) => setAddPhone(e.target.value)} />
          <Select label="Role" value={addRole} onChange={(e) => setAddRole(e.target.value as any)}>
            <option value="user">Standard User</option>
            <option value="superuser">Superuser (Admin)</option>
            <option value="guest">Guest (Read Only)</option>
          </Select>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secondary" onClick={() => setIsAddingUser(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>Create User</Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT USER MODAL */}
      <Dialog isOpen={editUser !== null} onClose={() => setEditUser(null)} title="Edit User Account" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input label="English Name" required value={editNameEn} onChange={(e) => setEditNameEn(e.target.value)} />
          <Input label="Hindi Name" required value={editNameHi} onChange={(e) => setEditNameHi(e.target.value)} />
          <Input label="English Designation" value={editDesignationEn} onChange={(e) => setEditDesignationEn(e.target.value)} />
          <Input label="Hindi Designation" value={editDesignationHi} onChange={(e) => setEditDesignationHi(e.target.value)} />
          <Input label="Email Address" type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
          <Input label="Phone Number" required value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
          <Select label="Role" value={editRole} onChange={(e) => setEditRole(e.target.value as any)}>
            <option value="user">Standard User</option>
            <option value="superuser">Superuser (Admin)</option>
            <option value="guest">Guest (Read Only)</option>
          </Select>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>Save Changes</Button>
          </div>
        </form>
      </Dialog>

      {/* PLAINTEXT GENERATED PASSWORD MODAL */}
      <Dialog
        isOpen={createdUserPass !== null || generatedPassword !== null}
        onClose={() => { setCreatedUserPass(null); setGeneratedPassword(null); }}
        title="Generated Temporary Password"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-muted)]">
            Below is the temporary plaintext password generated for {createdUserName || 'the user account'}. Please copy and communicate it to the user. <strong>It will not be displayed again.</strong>
          </p>

          <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-center font-mono font-bold text-base text-[var(--brand-primary)] select-all">
            {createdUserPass || generatedPassword}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => { setCreatedUserPass(null); setGeneratedPassword(null); }}>
              Done / Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* DELETE USER MODAL */}
      <Dialog isOpen={deletingUser !== null} onClose={() => setDeletingUser(null)} title="Delete User Account" size="md">
        {deletingUser && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Are you sure you want to delete user <strong>{deletingUser.nameEn} ({deletingUser.email})</strong>?
            </p>

            <Select
              label="Reassign Tender Ownership To"
              value={reassignOwnerId}
              onChange={(e) => setReassignOwnerId(e.target.value)}
              helperText="Required if user currently owns active tenders."
            >
              <option value="">Select replacement owner...</option>
              {usersList.filter(u => u.id !== deletingUser.id).map(u => (
                <option key={u.id} value={u.id}>{u.nameEn} ({u.role})</option>
              ))}
            </Select>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="secondary" onClick={() => setDeletingUser(null)}>Cancel</Button>
              <Button variant="danger" isLoading={isSaving} onClick={handleDeleteUserSubmit}>
                Confirm Delete User
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* CREATE TEMPLATE MODAL */}
      <Dialog isOpen={isAddingTemplate} onClose={() => setIsAddingTemplate(false)} title="Create Master Checklist Template" size="lg">
        <form onSubmit={handleCreateTemplateSubmit} className="space-y-5">
          <Input label="Template Profile Name" required value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Standard MRPL Checklist (v2)" />
          <Input label="Description (Optional)" value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} />

          <div className="pt-2">
            <ChecklistEditor
              items={templateItems}
              onChangeItems={(items) => setTemplateItems(items)}
              title="Template Criteria Builder"
              description="Define the default verification criteria included whenever a new tender selects this template profile."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <Button type="button" variant="secondary" onClick={() => setIsAddingTemplate(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>Save Template Profile</Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT TEMPLATE MODAL */}
      <Dialog isOpen={editingTemplate !== null} onClose={() => setEditingTemplate(null)} title="Edit Master Checklist Template" size="lg">
        <form onSubmit={handleEditTemplateSubmit} className="space-y-5">
          <Input label="Template Profile Name" required value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
          <Input label="Description" value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} />

          <div className="pt-2">
            <ChecklistEditor
              items={templateItems}
              onChangeItems={(items) => setTemplateItems(items)}
              title="Template Criteria Builder"
              description="Modify verification criteria for this master template profile."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <Button type="button" variant="secondary" onClick={() => setEditingTemplate(null)}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>Save Changes</Button>
          </div>
        </form>
      </Dialog>

      {/* DELETE TEMPLATE MODAL */}
      <Dialog isOpen={deletingTemplate !== null} onClose={() => setDeletingTemplate(null)} title="Delete Master Template" size="sm">
        {deletingTemplate && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Are you sure you want to delete template <strong>{deletingTemplate.name}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setDeletingTemplate(null)}>Cancel</Button>
              <Button variant="danger" isLoading={isSaving} onClick={handleDeleteTemplateSubmit}>Confirm Delete</Button>
            </div>
          </div>
        )}
      </Dialog>

    </div>
  );
}
