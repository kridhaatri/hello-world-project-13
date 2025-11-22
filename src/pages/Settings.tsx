import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useResources } from "@/contexts/ResourceContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, User, Palette, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const resourceSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").max(50, "Title must be less than 50 characters"),
  value: z.string().trim().min(1, "Value cannot be empty").max(100, "Value must be less than 100 characters"),
  description: z.string().trim().min(1, "Description cannot be empty").max(200, "Description must be less than 200 characters"),
});

const creatorSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(100, "Name must be less than 100 characters"),
  tagline: z.string().trim().min(1, "Tagline cannot be empty").max(200, "Tagline must be less than 200 characters"),
});

const Settings = () => {
  const navigate = useNavigate();
  const { resources, updateResource, creatorInfo, updateCreatorInfo } = useResources();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", value: "", description: "" });
  const [creatorForm, setCreatorForm] = useState(creatorInfo);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEditClick = (resource: typeof resources[0]) => {
    setEditingId(resource.id);
    setEditForm({
      title: resource.title,
      value: resource.value,
      description: resource.description,
    });
    setErrors({});
  };

  const handleSaveResource = (id: string) => {
    try {
      const validated = resourceSchema.parse(editForm);
      updateResource(id, validated);
      setEditingId(null);
      setErrors({});
      toast({
        title: "Success!",
        description: "Resource updated successfully",
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
          <h2 className="text-2xl font-bold text-foreground mb-6">Edit Resources</h2>
          <div className="space-y-4">
            {resources.map((resource) => (
              <Card
                key={resource.id}
                className="p-6 bg-gradient-card border-border/50 hover:shadow-elegant transition-all animate-fade-in"
              >
                {editingId === resource.id ? (
                  <div className="space-y-4">
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
                    <Button
                      variant="outline"
                      onClick={() => handleEditClick(resource)}
                      className="hover:bg-gradient-primary/10"
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Settings;
