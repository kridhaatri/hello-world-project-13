import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useResources } from "@/contexts/ResourceContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, User, Palette, Users, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const resourceSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").max(50, "Title must be less than 50 characters"),
  value: z.string().trim().min(1, "Value cannot be empty").max(100, "Value must be less than 100 characters"),
  description: z.string().trim().min(1, "Description cannot be empty").max(200, "Description must be less than 200 characters"),
  icon: z.string().trim().min(1, "Icon must be selected"),
});

const creatorSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(100, "Name must be less than 100 characters"),
  tagline: z.string().trim().min(1, "Tagline cannot be empty").max(200, "Tagline must be less than 200 characters"),
});

const iconOptions = ["Server", "Globe", "Link", "Database", "Cloud", "Network", "Lock", "Box", "FileText"];

const Settings = () => {
  const navigate = useNavigate();
  const { resources, updateResource, addResource, deleteResource, creatorInfo, updateCreatorInfo } = useResources();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", value: "", description: "", icon: "" });
  const [creatorForm, setCreatorForm] = useState(creatorInfo);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleEditClick = (resource: typeof resources[0]) => {
    setEditingId(resource.id);
    setIsAddingNew(false);
    setEditForm({
      title: resource.title,
      value: resource.value,
      description: resource.description,
      icon: resource.icon,
    });
    setErrors({});
  };

  const handleAddNewClick = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setEditForm({ title: "", value: "", description: "", icon: "Server" });
    setErrors({});
  };

  const handleSaveResource = (id?: string) => {
    try {
      const validated = resourceSchema.parse(editForm);
      
      if (isAddingNew) {
        addResource({
          title: validated.title,
          value: validated.value,
          description: validated.description,
          icon: validated.icon,
        });
        setIsAddingNew(false);
        toast({
          title: "Success!",
          description: "Resource added successfully",
        });
      } else if (id) {
        updateResource(id, validated);
        setEditingId(null);
        toast({
          title: "Success!",
          description: "Resource updated successfully",
        });
      }
      
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const handleDeleteResource = (id: string) => {
    deleteResource(id);
    setDeleteConfirmId(null);
    toast({
      title: "Deleted",
      description: "Resource deleted successfully",
    });
  };

  const handleSaveCreatorInfo = () => {
    try {
      const validated = creatorSchema.parse(creatorForm);
      updateCreatorInfo({ name: validated.name, tagline: validated.tagline });
      toast({
        title: "Success!",
        description: "Creator info updated successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

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
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-muted-foreground mt-1">Edit your dashboard resources and information</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 space-y-12 max-w-4xl">
        {/* Admin Only Sections */}
        {isAdmin && (
          <>
            <section className="animate-fade-in">
              <Card className="p-6 bg-gradient-card border-border/50 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/user-management")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-primary">
                      <Users className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">User Management</h2>
                      <p className="text-muted-foreground mt-1">Manage users and assign roles</p>
                    </div>
                  </div>
                  <Button variant="outline">
                    Manage
                  </Button>
                </div>
              </Card>
            </section>

            <section className="animate-fade-in">
              <Card className="p-6 bg-gradient-card border-border/50 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/theme-settings")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-primary">
                      <Palette className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Theme Settings</h2>
                      <p className="text-muted-foreground mt-1">Customize your app's color scheme</p>
                    </div>
                  </div>
                  <Button variant="outline">
                    Configure
                  </Button>
                </div>
              </Card>
            </section>
          </>
        )}

        {/* Creator Info Section */}
        <section className="animate-fade-in">
          <Card className="p-6 bg-gradient-card border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-gradient-primary">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Creator Information</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="creator-name">Your Name</Label>
                <Input
                  id="creator-name"
                  value={creatorForm.name}
                  onChange={(e) => setCreatorForm({ ...creatorForm, name: e.target.value })}
                  placeholder="Enter your name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="creator-tagline">Tagline</Label>
                <Textarea
                  id="creator-tagline"
                  value={creatorForm.tagline}
                  onChange={(e) => setCreatorForm({ ...creatorForm, tagline: e.target.value })}
                  placeholder="Enter your tagline"
                  rows={2}
                  className={errors.tagline ? "border-red-500" : ""}
                />
                {errors.tagline && <p className="text-sm text-red-500">{errors.tagline}</p>}
              </div>

              <Button
                onClick={handleSaveCreatorInfo}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Creator Info
              </Button>
            </div>
          </Card>
        </section>

        {/* Resources Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Edit Resources</h2>
            <Button
              onClick={handleAddNewClick}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </div>

          {/* Add New Resource Form */}
          {isAddingNew && (
            <Card className="p-6 bg-gradient-card border-border/50 hover:shadow-elegant transition-all animate-fade-in mb-4">
              <h3 className="text-lg font-semibold mb-4">Add New Resource</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-icon">Icon</Label>
                  <Select value={editForm.icon} onValueChange={(value) => setEditForm({ ...editForm, icon: value })}>
                    <SelectTrigger id="new-icon" className={errors.icon ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.icon && <p className="text-sm text-red-500">{errors.icon}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-title">Resource Title</Label>
                  <Input
                    id="new-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="e.g., Virtual Machine"
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-value">Resource Name/Value</Label>
                  <Input
                    id="new-value"
                    value={editForm.value}
                    onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                    placeholder="e.g., VM-Server-01"
                    className={errors.value ? "border-red-500" : ""}
                  />
                  {errors.value && <p className="text-sm text-red-500">{errors.value}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-description">Description</Label>
                  <Textarea
                    id="new-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="e.g., Your primary virtual machine instance"
                    rows={2}
                    className={errors.description ? "border-red-500" : ""}
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSaveResource()}
                    className="flex-1 bg-gradient-primary hover:opacity-90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Add Resource
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingNew(false);
                      setErrors({});
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {resources.map((resource) => (
              <Card
                key={resource.id}
                className="p-6 bg-gradient-card border-border/50 hover:shadow-elegant transition-all animate-fade-in"
              >
                {editingId === resource.id ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`icon-${resource.id}`}>Icon</Label>
                      <Select value={editForm.icon} onValueChange={(value) => setEditForm({ ...editForm, icon: value })}>
                        <SelectTrigger id={`icon-${resource.id}`} className={errors.icon ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map((icon) => (
                            <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.icon && <p className="text-sm text-red-500">{errors.icon}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`title-${resource.id}`}>Resource Title</Label>
                      <Input
                        id={`title-${resource.id}`}
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="e.g., Virtual Machine"
                        className={errors.title ? "border-red-500" : ""}
                      />
                      {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`value-${resource.id}`}>Resource Name/Value</Label>
                      <Input
                        id={`value-${resource.id}`}
                        value={editForm.value}
                        onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                        placeholder="e.g., VM-Server-01"
                        className={errors.value ? "border-red-500" : ""}
                      />
                      {errors.value && <p className="text-sm text-red-500">{errors.value}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`description-${resource.id}`}>Description</Label>
                      <Textarea
                        id={`description-${resource.id}`}
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="e.g., Your primary virtual machine instance"
                        rows={2}
                        className={errors.description ? "border-red-500" : ""}
                      />
                      {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveResource(resource.id)}
                        className="flex-1 bg-gradient-primary hover:opacity-90"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setErrors({});
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteConfirmId(resource.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">{resource.title}</h3>
                      <p className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        {resource.value}
                      </p>
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleEditClick(resource)}
                        className="hover:bg-gradient-primary/10"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteConfirmId(resource.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this resource. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteResource(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
