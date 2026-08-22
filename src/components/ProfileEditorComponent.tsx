import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import supabase from "@/utils/supabase";
import { Upload, Save, X } from "lucide-react";

interface ProfileEditorComponentProps {
  profile: any;
  userId: string;
  onSave: () => void;
  isOwnProfile: boolean;
}

const ProfileEditorComponent = ({
  profile,
  userId,
  onSave,
  isOwnProfile,
}: ProfileEditorComponentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      let avatarUrl = formData.avatar_url;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      const { error } = await supabase.from("profiles").update({
        display_name: formData.display_name,
        bio: formData.bio,
        location: formData.location,
        avatar_url: avatarUrl,
      });

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setImageFile(null);
      setPreviewUrl(null);
      onSave();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!isOwnProfile && isEditing) {
    return null;
  }

  if (!isEditing) {
    return (
      <>
        {isOwnProfile && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
          >
            Edit Profile
          </Button>
        )}
      </>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex items-center gap-4">
          <Avatar className="w-24 h-24">
            <AvatarImage src={previewUrl || formData.avatar_url} />
            <AvatarFallback>{formData.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              id="avatar-upload"
              className="hidden"
            />
            <label htmlFor="avatar-upload">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="cursor-pointer"
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Avatar
                </span>
              </Button>
            </label>
            {imageFile && (
              <p className="text-xs text-muted-foreground mt-2">
                {imageFile.name}
              </p>
            )}
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="text-sm font-medium">Display Name</label>
          <Input
            value={formData.display_name || ""}
            onChange={(e) =>
              setFormData({ ...formData, display_name: e.target.value })
            }
            placeholder="Your display name"
            className="mt-2"
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-medium">Location</label>
          <Input
            value={formData.location || ""}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="Your location"
            className="mt-2"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="text-sm font-medium">Bio</label>
          <Textarea
            value={formData.bio || ""}
            onChange={(e) =>
              setFormData({ ...formData, bio: e.target.value })
            }
            placeholder="Tell us about yourself"
            className="mt-2 min-h-24 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            onClick={() => {
              setIsEditing(false);
              setImageFile(null);
              setPreviewUrl(null);
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileEditorComponent;
