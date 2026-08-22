import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, User, Filter } from "lucide-react";
import supabase from "@/utils/supabase";
import { useTheme } from "@/context/ThemeContext";
import { Task, BoardColumn, TaskStatus } from "@/types/workspace";

interface KanbanBoardProps {
  boardId: string;
  projectId: string;
}

const columnConfig: Record<
  TaskStatus,
  { label: string; color: string; bgColor: string }
> = {
  planned: { label: "В планах", color: "text-gray-600", bgColor: "bg-gray-50" },
  in_progress: {
    label: "Делается",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  done: { label: "Сделано", color: "text-green-600", bgColor: "bg-green-50" },
  abandoned: {
    label: "Брошено",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
};

const KanbanBoard = ({ boardId, projectId }: KanbanBoardProps) => {
  const { isDark } = useTheme();
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  // Инициализируем состояние формы из localStorage
  const [formState, setFormState] = useState(() => {
    const saved = localStorage.getItem(`kanban_form_${projectId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { showNewTaskModal: null, newTaskTitle: "" };
      }
    }
    return { showNewTaskModal: null, newTaskTitle: "" };
  });

  const showNewTaskModal = formState.showNewTaskModal;
  const newTaskTitle = formState.newTaskTitle;

  // Обновляем localStorage каждый раз, когда меняется формState
  useEffect(() => {
    localStorage.setItem(`kanban_form_${projectId}`, JSON.stringify(formState));
  }, [formState, projectId]);

  const setShowNewTaskModal = (status: TaskStatus | null) => {
    setFormState(prev => ({
      ...prev,
      showNewTaskModal: status
    }));
  };

  const setNewTaskTitle = (title: string) => {
    setFormState(prev => ({
      ...prev,
      newTaskTitle: title
    }));
  };

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [assigningSearchText, setAssigningSearchText] = useState("");
  // Флаг для предотвращения загрузки данных, пока пользователь пишет в форме
  const [isUserTyping, setIsUserTyping] = useState(false);

  useEffect(() => {
    loadData();
  }, [boardId]);

  useEffect(() => {
    if (!projectId) return;

    // Subscribe to real-time changes - но только если пользователь не пишет в форме
    const channel = supabase
      .channel(`project:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          console.log("Realtime update detected");
          // Не загружаем, если пользователь пишет в форме
          if (!isUserTyping && !showNewTaskModal && editingTaskId === null) {
            console.log("Reloading tasks...");
            loadData();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_columns",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          console.log("Columns updated");
          if (!isUserTyping && !showNewTaskModal && editingTaskId === null) {
            loadData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, isUserTyping, showNewTaskModal, editingTaskId]);

  const loadData = async () => {
    try {
      const statuses: TaskStatus[] = ["planned", "in_progress", "done", "abandoned"];

      // Load columns for project (not filtering by board_id as old data might not have it)
      const { data: columnsData, error: columnsError } = await supabase
        .from("board_columns")
        .select("*")
        .eq("project_id", projectId)
        .in("status", statuses)
        .order("order", { ascending: true });

      if (columnsError) {
        console.error("Columns error:", columnsError);
        throw columnsError;
      }

      let finalColumns = columnsData;

      if (!columnsData || columnsData.length === 0) {
        console.log("Creating default columns for board:", boardId);
        // Create default columns for this board
        const newColumns = statuses.map((status, index) => ({
          project_id: projectId,
          board_id: boardId,
          name: columnConfig[status].label,
          status,
          order: index,
        }));

        const { data: createdCols, error: createError } = await supabase
          .from("board_columns")
          .insert(newColumns)
          .select();

        if (createError) {
          console.error("Create columns error details:", createError);
          throw createError;
        }
        console.log("Created columns:", createdCols);
        setColumns(createdCols || []);
        finalColumns = createdCols || [];
      } else {
        console.log("Loaded columns:", columnsData);
        setColumns(columnsData);
      }

      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("project_id", projectId);

      if (!membersError && membersData) {
        setTeamMembers(membersData);
      }

      // Load tasks only for this board's columns
      const boardColumnsIds = finalColumns?.map((col: any) => col.id) || [];
      
      if (boardColumnsIds.length > 0) {
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .in("column_id", boardColumnsIds);

        if (tasksError) {
          console.error("Tasks error:", tasksError);
          throw tasksError;
        }
        console.log("Loaded tasks for board:", tasksData);
        setTasks(tasksData || []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Error loading board data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (status: TaskStatus) => {
    if (!newTaskTitle.trim()) return;

    const column = columns.find((c) => c.status === status);
    if (!column) return;

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            column_id: column.id,
            project_id: projectId,
            title: newTaskTitle,
            completed: false,
            order: tasks.filter((t) => {
              const col = columns.find((c) => c.id === t.column_id);
              return col?.status === status;
            }).length,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setTasks([...tasks, data]);
      setNewTaskTitle("");
      setShowNewTaskModal(null);
      // Очищаем localStorage после создания
      localStorage.removeItem(`kanban_form_${projectId}`);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const newColumn = columns.find((c) => c.status === newStatus);
      if (!newColumn) return;

      const { error } = await supabase
        .from("tasks")
        .update({ column_id: newColumn.id })
        .eq("id", taskId);

      if (error) throw error;

      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, column_id: newColumn.id } : t
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const updateTaskAssignee = async (taskId: string, assigneeName: string | null) => {
    try {
      // If assigneeName is provided, use it as assigned_user_email instead of looking up in team_members
      const { error } = await supabase
        .from("tasks")
        .update({ assigned_user_email: assigneeName })
        .eq("id", taskId);

      if (error) throw error;

      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, assigned_user_email: assigneeName } : t
        )
      );
      setAssigningTaskId(null);
      setAssigningSearchText("");
    } catch (error) {
      console.error("Error updating task assignee:", error);
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ completed: !task.completed })
        .eq("id", task.id);

      if (error) throw error;

      setTasks(
        tasks.map((t) =>
          t.id === task.id ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };
  const updateTaskTitle = async (taskId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ title: newTitle })
        .eq("id", taskId);

      if (error) throw error;

      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, title: newTitle } : t
        )
      );
      setEditingTaskId(null);
    } catch (error) {
      console.error("Error updating task title:", error);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  console.log("KanbanBoard render:", { sortedColumns, tasks, loading });

  // Фильтруем задачи по выбранному члену команды
  const filteredTasks = selectedMemberId
    ? tasks.filter(t => t.assigned_to === selectedMemberId)
    : tasks;

  return (
    <div className="space-y-6">
      {/* Filter by team member */}
      <div className="flex items-center gap-2 pb-4 border-b">
        <Filter size={18} />
        <span className="text-sm font-medium">Назначено:</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setSelectedMemberId(null)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            !selectedMemberId
              ? isDark ? "bg-white text-black" : "bg-black text-white"
              : isDark ? "border border-gray-700 text-white hover:bg-gray-900" : "border border-gray-300 hover:bg-gray-100"
          }`}
        >
          Все
        </motion.button>
        {teamMembers.map((member) => (
          <motion.button
            key={member.id}
            whileHover={{ scale: 1.05 }}
            onClick={() => setSelectedMemberId(member.user_id)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              selectedMemberId === member.user_id
                ? isDark ? "bg-white text-black" : "bg-black text-white"
                : isDark ? "border border-gray-700 text-white hover:bg-gray-900" : "border border-gray-300 hover:bg-gray-100"
            }`}
          >
            <User size={14} className="inline mr-1" />
            {member.role}
          </motion.button>
        ))}
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 pt-4 w-full">
      <AnimatePresence mode="popLayout">
        {sortedColumns.map((column) => {
          const columnTasks = filteredTasks.filter((t) => t.column_id === column.id);
          const columnConfig_item =
            columnConfig[column.status as TaskStatus];

          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-shrink-0 w-80"
            >
              {/* Column Header */}
              <div className="mb-4">
                <h3 className={`font-medium text-sm ${columnConfig_item.color}`}>
                  {columnConfig_item.label} ({columnTasks.length})
                </h3>
              </div>

              {/* Droppable Area */}
              <motion.div
                className={`${columnConfig_item.bgColor} rounded-lg p-4 min-h-96 space-y-3 transition-colors`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("ring-2", "ring-black");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("ring-2", "ring-black");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("ring-2", "ring-black");
                  if (draggedTask) {
                    updateTaskStatus(
                      draggedTask.id,
                      column.status as TaskStatus
                    );
                    setDraggedTask(null);
                  }
                }}
              >
                {/* Tasks */}
                <AnimatePresence mode="popLayout">
                  {columnTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      whileHover={{ y: -2 }}
                      draggable
                      onDragStart={() => setDraggedTask(task)}
                      onDragEnd={() => setDraggedTask(null)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all group"
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div
                          onClick={() => toggleTaskComplete(task)}
                          className="flex items-center gap-2 flex-1"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => {}}
                            className="w-4 h-4 rounded accent-black"
                          />
                          {editingTaskId === task.id ? (
                            <input
                              autoFocus
                              type="text"
                              value={editingTaskTitle}
                              onChange={(e) => setEditingTaskTitle(e.target.value)}
                              onBlur={() => updateTaskTitle(task.id, editingTaskTitle)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateTaskTitle(task.id, editingTaskTitle);
                                } else if (e.key === "Escape") {
                                  setEditingTaskId(null);
                                }
                              }}
                              className={`flex-1 px-2 py-1 rounded font-medium text-sm focus:outline-none focus:ring-1 ${
                                isDark
                                  ? "bg-gray-800 text-white border border-gray-700 focus:border-white focus:ring-white"
                                  : "bg-white text-black border border-black focus:border-black focus:ring-black"
                              }`}
                            />
                          ) : (
                            <span
                              onDoubleClick={() => {
                                setEditingTaskId(task.id);
                                setEditingTaskTitle(task.title);
                              }}
                              className={`font-medium text-sm flex-1 cursor-text ${
                                task.completed
                                  ? "line-through text-gray-400"
                                  : "text-black"
                              }`}
                            >
                              {task.title}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                        >
                          <X size={16} className="text-red-600" />
                        </button>
                      </div>

                      {/* Task Meta */}
                      <div className="space-y-2 text-xs text-gray-500 mt-3 mb-2">
                        {/* Creator info скрыта на время из-за RLS ограничений */}
                        {task.due_date && (
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Assign to member */}
                      {assigningTaskId === task.id ? (
                        <div className="relative pt-2 flex gap-2 items-center">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Имя, email..."
                            value={assigningSearchText}
                            onChange={(e) => setAssigningSearchText(e.target.value)}
                            className={`flex-1 px-2 py-1.5 rounded text-xs border focus:outline-none focus:ring-1 transition-colors ${
                              isDark
                                ? "bg-gray-900 text-white border-gray-700 focus:border-white focus:ring-white"
                                : "bg-white text-black border-gray-300 focus:border-black focus:ring-black"
                            }`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && assigningSearchText.trim()) {
                                updateTaskAssignee(task.id, assigningSearchText.trim());
                              }
                              if (e.key === "Escape") {
                                setAssigningTaskId(null);
                                setAssigningSearchText("");
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (assigningSearchText.trim()) {
                                updateTaskAssignee(task.id, assigningSearchText.trim());
                              }
                            }}
                            disabled={!assigningSearchText.trim()}
                            className={`whitespace-nowrap px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                              !assigningSearchText.trim()
                                ? isDark
                                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : isDark
                                ? "bg-blue-600 text-white hover:bg-blue-500 active:scale-95"
                                : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                            }`}
                          >
                            Назначить
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setAssigningTaskId(null);
                              setAssigningSearchText("");
                            }}
                            className={`whitespace-nowrap px-2.5 py-1.5 rounded text-xs font-semibold transition-all ${
                              isDark
                                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssigningTaskId(task.id);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2 ${
                            task.assigned_user_email
                              ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <User size={12} />
                          {task.assigned_user_email ? task.assigned_user_email : "Назначить"}
                        </button>
                      )}

                      {/* Description */}
                      {task.description && (
                        <p className="mt-2 text-xs text-gray-600">
                          {task.description}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Add Task Button */}
                {showNewTaskModal === column.status ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <input
                      type="text"
                      autoFocus
                      placeholder="Task title"
                      value={newTaskTitle}
                      onChange={(e) => {
                        setNewTaskTitle(e.target.value);
                        setIsUserTyping(true);
                      }}
                      onBlur={() => setIsUserTyping(false)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${
                        isDark
                          ? "bg-gray-900 text-white border-gray-700 focus:border-white focus:ring-white placeholder-gray-400"
                          : "bg-white text-black border-gray-300 focus:border-black focus:ring-black placeholder-gray-600"
                      }`}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") createTask(column.status as TaskStatus);
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          createTask(column.status as TaskStatus)
                        }
                        className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors font-medium ${
                          isDark
                            ? "bg-white text-black hover:bg-gray-100"
                            : "bg-black text-white hover:bg-gray-900"
                        }`}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowNewTaskModal(null);
                          setNewTaskTitle("");
                        }}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors font-medium ${
                          isDark
                            ? "border border-gray-700 text-white hover:bg-gray-900"
                            : "border border-gray-300 text-black hover:bg-gray-100"
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNewTaskModal(column.status as TaskStatus)}
                    className="w-full py-2 text-sm text-gray-600 hover:text-black flex items-center justify-center gap-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    Add task
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default KanbanBoard;
