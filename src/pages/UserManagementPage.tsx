import { parseApiError } from "@/lib/utils";
import type { ManagedUser } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { Th, TableEmpty } from "@/components/ui/table";
import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/api";

const EMPTY_FORM = {
  email: "",
  username: "",
  password: "",
  role: "VIEWER",
  is_active: true,
};

const FILTER_CLS =
  "rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white";

export default function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadUsers = useCallback(() => {
    setLoading(true);
    getUsers(roleFilter || undefined)
      .then((res) => setUsers(res.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (u: ManagedUser) => {
    setEditUser(u);
    setForm({
      email: u.email,
      username: u.username,
      password: "",
      role: u.role,
      is_active: u.is_active,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    setSaving(true);
    try {
      if (editUser) {
        const data = { ...form } as Partial<typeof form>;
        if (!data.password) delete data.password;
        await updateUser(editUser.id, data);
      } else {
        await createUser(form);
      }
      setDialogOpen(false);
      loadUsers();
    } catch (err) {
      setFormError(parseApiError(err, "Save failed."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err) {
      setFormError(parseApiError(err, "Delete failed."));
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="size-4" /> Add User
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={FILTER_CLS}
        >
          <option value="">All Roles</option>
          <option value="VIEWER">Viewer</option>
          <option value="ANALYST">Analyst</option>
        </select>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th className="w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading || users.length === 0 ? (
              <TableEmpty
                colSpan={4}
                loading={loading}
                emptyText="No users found."
              />
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-800">
                      {u.username}
                    </p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`flex items-center gap-1.5 text-xs font-medium w-fit ${u.is_active ? "text-green-600" : "text-gray-400"}`}
                    >
                      {u.is_active ? (
                        <UserCheck className="size-3.5" />
                      ) : (
                        <UserX className="size-3.5" />
                      )}
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editUser ? "Edit User" : "Add User"}
        error={formError}
        onSave={handleSave}
        saving={saving}
        saveLabel={editUser ? "Save Changes" : "Add User"}
      >
        <FormField label="Email">
          <Input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </FormField>

        <FormField label="Username">
          <Input
            type="text"
            required
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({ ...f, username: e.target.value }))
            }
          />
        </FormField>

        <FormField
          label="Password"
          hint={editUser ? "(leave blank to keep)" : undefined}
        >
          <Input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            placeholder={
              editUser
                ? "••••••••"
                : "Uppercase, number & special char required"
            }
          />
        </FormField>

        <FormField label="Role">
          <Select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          >
            <option value="VIEWER">Viewer</option>
            <option value="ANALYST">Analyst</option>
          </Select>
        </FormField>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_active: e.target.checked }))
            }
            className="rounded border-gray-300 accent-blue-600"
          />
          <span className="text-sm text-gray-700">Active</span>
        </label>
      </Modal>
    </div>
  );
}
