import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase";

const WorkspaceInvite = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectName, setProjectName] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndProject();
  }, [inviteCode]);

  const checkAuthAndProject = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate("/workspace-auth");
        return;
      }

      setUser(sessionData.session.user);

      if (!inviteCode) {
        setError("Invalid invite code");
        return;
      }

      const { data: projectData, error: projectError } = await supabase
        .from("workspace_projects")
        .select("id, name, user_id")
        .eq("invite_code", inviteCode)
        .single();

      if (projectError || !projectData) {
        setError("Project not found or invite expired");
        setLoading(false);
        return;
      }

      setProjectName(projectData.name);

      if (projectData.user_id === sessionData.session.user.id) {
        navigate(`/workspace/project/${projectData.id}`);
        return;
      }

      checkAndJoinProject(projectData.id, sessionData.session.user.id);
    } catch (err) {
      console.error("Error:", err);
      setError("An error occurred");
      setLoading(false);
    }
  };

  const checkAndJoinProject = async (projectId: string, userId: string) => {
    try {
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .single();

      if (existingMember) {
        navigate(`/workspace/project/${projectId}`);
        return;
      }

      const { error: joinError } = await supabase
        .from("team_members")
        .insert([
          {
            project_id: projectId,
            user_id: userId,
            role: "member",
          },
        ]);

      if (joinError) throw joinError;

      navigate(`/workspace/project/${projectId}`);
    } catch (err) {
      console.error("Error joining project:", err);
      setError("Failed to join project");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        {loading && (
          <>
            <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Joining project "{projectName}"...</p>
          </>
        )}

        {error && !loading && (
          <>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/workspace")}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back to Workspace
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkspaceInvite;
