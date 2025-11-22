import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Shield, ShieldOff, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
}

const UserManagement = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email || "No email",
        created_at: profile.created_at || "",
        roles: (userRoles || [])
          .filter((ur) => ur.user_id === profile.id)
          .map((ur) => ur.role),
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, role: "admin" | "user") => {
    try {
      const user = users.find((u) => u.id === userId);
      const hasRole = user?.roles.includes(role);

      if (hasRole) {
        // Remove role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);

        if (error) throw error;

        toast({
          title: "Role Removed",
          description: `${role} role removed successfully`,
        });
      } else {
        // Add role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });

        if (error) throw error;

        toast({
          title: "Role Assigned",
          description: `${role} role assigned successfully`,
        });
      }

      // Refresh users
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  const bulkToggleRole = async (role: "admin" | "user", action: "assign" | "revoke") => {
    if (selectedUsers.size === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to perform bulk operations",
        variant: "destructive",
      });
      return;
    }

    try {
      const userIds = Array.from(selectedUsers);

      if (action === "assign") {
        // Bulk assign role
        const insertData = userIds.map((userId) => ({
          user_id: userId,
          role,
        }));

        const { error } = await supabase
          .from("user_roles")
          .upsert(insertData, { onConflict: "user_id,role" });

        if (error) throw error;

        toast({
          title: "Roles Assigned",
          description: `${role} role assigned to ${userIds.length} user(s)`,
        });
      } else {
        // Bulk revoke role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .in("user_id", userIds)
          .eq("role", role);

        if (error) throw error;

        toast({
          title: "Roles Revoked",
          description: `${role} role revoked from ${userIds.length} user(s)`,
        });
      }

      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to perform bulk operation",
        variant: "destructive",
      });
    }
  };

  if (authLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-gradient-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gradient-primary">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-muted-foreground mt-1">Manage user roles and permissions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <Card className="p-6 bg-gradient-card border-border/50">
          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {selectedUsers.size} user(s) selected
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => bulkToggleRole("admin", "assign")}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Make Admin
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => bulkToggleRole("admin", "revoke")}
                  >
                    <ShieldOff className="w-4 h-4 mr-1" />
                    Revoke Admin
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedUsers(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onCheckedChange={toggleAllUsers}
                      />
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={role === "admin" ? "default" : "secondary"}
                            >
                              {role}
                            </Badge>
                          ))}
                          {user.roles.length === 0 && (
                            <Badge variant="outline">No roles</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant={user.roles.includes("admin") ? "destructive" : "default"}
                            onClick={() => toggleRole(user.id, "admin")}
                            className={!user.roles.includes("admin") ? "bg-gradient-primary hover:opacity-90" : ""}
                          >
                            {user.roles.includes("admin") ? (
                              <>
                                <ShieldOff className="w-4 h-4 mr-1" />
                                Revoke Admin
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 mr-1" />
                                Make Admin
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default UserManagement;
