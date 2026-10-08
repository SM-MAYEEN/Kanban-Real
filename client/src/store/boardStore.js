import { create } from 'zustand';
import API from '../api/axiosInstance';
import { getSocket } from '../socket/socketClient';

export const useBoardStore = create((set, get) => ({
  board: null,
  columns: [],
  tasks: [],
  loading: false,
  error: null,

  fetchBoardDetails: async (boardId) => {
    set({ loading: true, error: null });
    try {
      const res = await API.get(`/boards/${boardId}`);
      const { board, columns, tasks } = res.data;

      set({ board, columns, tasks, loading: false });

      const socket = getSocket();
      if (socket) {
        socket.emit('board:join', boardId);
      }
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load board',
        loading: false,
      });
    }
  },

  addTask: async (taskData) => {
    try {
      const res = await API.post('/tasks', taskData);
      const newTask = res.data;

      set((state) => ({ tasks: [...state.tasks, newTask] }));

      const socket = getSocket();
      if (socket) {
        socket.emit('task:created', {
          boardId: taskData.boardId,
          task: newTask,
        });
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  },

  // টাস্ক ডিলিট করার হ্যান্ডলার
  deleteTask: async (taskId) => {
    try {
      await API.delete(`/tasks/${taskId}`);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== taskId),
      }));

      const socket = getSocket();
      const board = get().board;
      if (socket && board) {
        socket.emit('task:deleted', {
          boardId: board._id,
          taskId,
        });
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  },

  moveTask: (taskId, sourceColumnId, destinationColumnId, newOrder) => {
    const { tasks, board } = get();

    const updatedTasks = tasks.map((t) => {
      if (t._id === taskId) {
        return { ...t, columnId: destinationColumnId, order: newOrder };
      }
      return t;
    });

    set({ tasks: updatedTasks });

    const socket = getSocket();
    if (socket && board) {
      socket.emit('task:move', {
        taskId,
        boardId: board._id,
        sourceColumnId,
        destinationColumnId,
        newOrder,
      });
    }
  },

  handleTaskMovedRemote: (payload) => {
    const { taskId, destinationColumnId, newOrder } = payload;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t._id === taskId
          ? { ...t, columnId: destinationColumnId, order: newOrder }
          : t
      ),
    }));
  },

  handleTaskCreatedRemote: (newTask) => {
    set((state) => {
      if (state.tasks.some((t) => t._id === newTask._id)) return state;
      return { tasks: [...state.tasks, newTask] };
    });
  },

  handleTaskDeletedRemote: ({ taskId }) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t._id !== taskId),
    }));
  },
}));