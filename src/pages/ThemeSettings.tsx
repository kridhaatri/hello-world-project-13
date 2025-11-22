import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Palette, Save } from "lucide-react";

interface ThemeColor {
  key: string;
  value: string;
  label: string;
  description: string;
}

const ThemeSettings = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [colors, setColors] = useState<ThemeColor[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    loadThemeConfig();
  }, [isAdmin, navigate]);

  const loadThemeConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("theme_config")
      .select("*")
      .order("config_key");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load theme configuration",
        variant: "destructive",
      });
    } else if (data) {
      const themeColors: ThemeColor[] = data.map((item) => ({
        key: item.config_key,
        value: typeof item.config_value === "string" ? item.config_value : String(item.config_value),
        label: formatLabel(item.config_key),
        description: getDescription(item.config_key),
      }));
      setColors(themeColors);
    }
    setLoading(false);
  };

  const formatLabel = (key: string): string => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      primary_color: "Main brand color used for buttons and highlights",
      primary_foreground: "Text color on primary surfaces",
      secondary_color: "Secondary UI surface color",
      secondary_foreground: "Text on secondary surfaces",
      accent_color: "Accent color for highlights",
      accent_foreground: "Text on accent surfaces",
      background_color: "Main background color",
      foreground_color: "Main text color",
    };
    return descriptions[key] || "";
  };

  const handleColorChange = (key: string, value: string) => {
    setColors((prev) =>
      prev.map((color) =>
        color.key === key ? { ...color, value } : color
      )
    );
  };

  const saveThemeConfig = async () => {
    setSaving(true);

    try {
      for (const color of colors) {
        const { error } = await supabase
          .from("theme_config")
          .update({
            config_value: color.value,
            updated_at: new Date().toISOString(),
          })
          .eq("config_key", color.key);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Theme configuration saved! Refresh page to see changes.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save theme configuration",
        variant: "destructive",
      });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading theme settings...</p>
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
              <Button
                variant="outline"
                onClick={() => navigate("/settings")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Theme Settings
                </h1>
                <p className="text-muted-foreground mt-2">Customize your app's color scheme</p>
              </div>
            </div>
            <Button
              onClick={saveThemeConfig}
              disabled={saving}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Color Configuration
            </CardTitle>
            <CardDescription>
              Configure HSL color values for your theme. Format: "hue saturation% lightness%"
              <br />
              Example: "222.2 84% 4.9%" for a dark blue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {colors.map((color) => (
              <div key={color.key} className="space-y-2">
                <Label htmlFor={color.key}>{color.label}</Label>
                <p className="text-sm text-muted-foreground">{color.description}</p>
                <Input
                  id={color.key}
                  value={color.value}
                  onChange={(e) => handleColorChange(color.key, e.target.value)}
                  placeholder="222.2 84% 4.9%"
                  className="font-mono"
                />
                <div
                  className="h-10 rounded-md border"
                  style={{ backgroundColor: `hsl(${color.value})` }}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-6 p-4 border border-border rounded-lg bg-muted/50">
          <h3 className="font-semibold mb-2">💡 HSL Color Format Tips</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Hue: 0-360 (color wheel position)</li>
            <li>Saturation: 0-100% (color intensity)</li>
            <li>Lightness: 0-100% (brightness)</li>
            <li>After saving, refresh the page to see changes applied</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default ThemeSettings;
