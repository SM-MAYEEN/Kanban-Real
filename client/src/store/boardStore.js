import { create } from 'zustand';
import API from '../api/axiosInstance';

export const useBoardStore = create((set, get) => ({
  board: null,
  columns: [],
  tasks: [],
  loading: false,
  error: null,

  // বোর্ড ডাটা ও টাস্ক লোড করা
  fetchBoardDetails: async (boardId) => {
    set({ loading: true, error: null });
    try {
      const res = await API.get(`/boards/${boardId}`);
      // API রেসপন্স ফরম্যাট হ্যান্ডলিং
      const boardData = res.data.board || res.data;
      const columnsData = res.data.columns || boardData.columns || [];
      const tasksData = res.data.tasks || boardData.tasks || [];

      set({
        board: boardData,
        columns: columnsData,
        tasks: tasksData,
        loading: false,
      });
    } catch (err) {
      console.error('Fetch Board Details Error:', err);
      set({ error: err.message, loading: false });
    }
  },

  // নতুন টাস্ক যোগ করা (বুলেটপ্রুফ স্টেট আপডেট)
  addTask: async (taskData) => {
    try {
      const res = await API.post('/tasks', taskData);
      
      // ব্যাকএন্ড রেসপন্স থেকে সঠিক টাস্ক অবজেক্ট নেওয়া
      const createdTask = res.data.task || res.data;

      // কলাম আইডি নিশ্চিত করা
      const normalizedTask = {
        ...createdTask,
        columnId: createdTask.columnId || createdTask.column || taskData.columnId,
        boardId: createdTask.boardId || createdTask.board || taskData.boardId,
      };

      // Zustand স্টেট আপডেট (নতুন টাস্ক সরাসরি অ্যারেতে পুশ)
      set((state) => ({
        tasks: [...state.tasks, normalizedTask],
      }));

      return normalizedTask;
    } catch (err) {
      console.error('Add Task Store Error:', err);
      throw err;
    }
  },

  // টাস্ক সরানো (Drag & Drop)
  moveTask: async (taskId, sourceColId, destColId, newIndex) => {
    const prevTasks = [...get().tasks];

    // অপটিমিস্টিক UI আপডেট
    set((state) => {
      const updatedTasks = state.tasks.map((t) => {
        if (t._id === taskId) {
          return {
            ...t,
            columnId: destColId,
            column: destColId,
            order: newIndex,
          };
        }
        return t;
      });
      return { tasks: updatedTasks };
    });

    try {
      await API.put(`/tasks/${taskId}/move`, {
        columnId: destColId,
        order: newIndex,
      });
    } catch (err) {
      console.error('Move Task Error:', err);
      // ব্যর্থ হলে আগের স্টেটে ফিরিয়ে আনা
      set({ tasks: prevTasks });
    }
  },

  // টাস্ক মুছে ফেলা
  deleteTask: async (taskId) => {
    try {
      await API.delete(`/tasks/${taskId}`);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== taskId),
      }));
    } catch (err) {
      console.error('Delete Task Error:', err);
    }
  },

  // Socket.io রিয়েল-টাইম হ্যান্ডলারসমূহ
  handleTaskCreatedRemote: (newTask) => {
    const taskObj = newTask.task || newTask;
    set((state) => {
      if (state.tasks.some((t) => t._id === taskObj._id)) return state;
      return { tasks: [...state.tasks, taskObj] };
    });
  },

  handleTaskMovedRemote: ({ taskId, columnId, order }) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t._id === taskId ? { ...t, columnId, column: columnId, order } : t
      ),
    }));
  },

  handleTaskDeletedRemote: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t._id !== taskId),
    }));
  },
}));