import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, User, Save } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  display_name: z.string().trim().max(100, "Name must be less than 100 characters").optional(),
  bio: z.string().trim().max(500, "Bio must be less than 500 characters").optional(),
});

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: null,
    bio: null,
    avatar_url: null,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      loadProfile();
    }
  }, [user, authLoading, navigate]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, bio, avatar_url")
      .eq("id", user.id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } else if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Avatar image must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("avatars")
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    }

    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate input
    try {
      profileSchema.parse({
        display_name: profile.display_name || undefined,
        bio: profile.bio || undefined,
      });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name || null,
          bio: profile.bio || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }

    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  My Profile
                </h1>
                <p className="text-muted-foreground mt-2">Manage your profile information</p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and avatar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Label htmlFor="avatar-upload">
                  <Button
                    variant="outline"
                    disabled={uploading}
                    asChild
                  >
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Avatar"}
                    </span>
                  </Button>
                </Label>
                <p className="text-xs text-muted-foreground mt-2">
                  Max size: 2MB. Formats: JPG, PNG, GIF
                </p>
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={profile.display_name || ""}
                onChange={(e) => handleInputChange("display_name", e.target.value)}
                placeholder="Enter your name"
                maxLength={100}
              />
              {errors.display_name && (
                <p className="text-sm text-destructive">{errors.display_name}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio || ""}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us about yourself..."
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">
                {profile.bio?.length || 0} / 500
              </p>
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
