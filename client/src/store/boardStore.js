import { create } from 'zustand';
import API from '../api/axiosInstance';

const getTaskColumnId = (task) =>
  (task.columnId?._id || task.columnId || task.column?._id || task.column)?.toString();

const orderTasksAfterMove = (tasks, taskId, destinationColumnId, newIndex) => {
  const movedTask = tasks.find((task) => task._id?.toString() === taskId?.toString());
  if (!movedTask) return tasks;

  const sourceColumnId = getTaskColumnId(movedTask);
  const destinationId = destinationColumnId?.toString();
  const sortByOrder = (left, right) => (left.order || 0) - (right.order || 0);
  const sourceTasks = tasks
    .filter((task) =>
      getTaskColumnId(task) === sourceColumnId
      && task._id?.toString() !== taskId?.toString()
    )
    .sort(sortByOrder);
  const destinationTasks = sourceColumnId === destinationId
    ? sourceTasks
    : tasks.filter((task) => getTaskColumnId(task) === destinationId).sort(sortByOrder);

  const insertionIndex = Math.min(Math.max(0, newIndex), destinationTasks.length);
  destinationTasks.splice(insertionIndex, 0, {
    ...movedTask,
    columnId: destinationId,
    column: destinationId,
  });

  const affectedColumnIds = new Set([sourceColumnId, destinationId]);
  const unchangedTasks = tasks.filter((task) => !affectedColumnIds.has(getTaskColumnId(task)));
  const orderedTasks = sourceColumnId === destinationId ? destinationTasks : [...sourceTasks, ...destinationTasks];

  return [
    ...unchangedTasks,
    ...orderedTasks.map((task, order) => ({ ...task, order })),
  ];
};

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
      
      const resData = res.data || {};
      const boardData = resData.board || (resData._id ? resData : null);
      
      // কলাম ও টাস্ক যেকোনো ফরমেটেই আসুক না কেন সেফলি এক্সট্র্যাক্ট করা
      let columnsData = [];
      if (Array.isArray(resData.columns)) {
        columnsData = resData.columns;
      } else if (boardData && Array.isArray(boardData.columns)) {
        columnsData = boardData.columns;
      }

      let tasksData = [];
      if (Array.isArray(resData.tasks)) {
        tasksData = resData.tasks;
      } else if (boardData && Array.isArray(boardData.tasks)) {
        tasksData = boardData.tasks;
      }

      // যদি টাস্ক আলাদা এন্ডপয়েন্ট থেকে আসে, তাও ব্যাকআপ ফেচ
      if (tasksData.length === 0) {
        try {
          const taskRes = await API.get(`/tasks/board/${boardId}`);
          if (Array.isArray(taskRes.data)) {
            tasksData = taskRes.data;
          }
        } catch {
          // ইগনোর যদি আলাদা রাউট না থাকে
        }
      }

      set({
        board: boardData,
        columns: columnsData,
        tasks: tasksData,
        loading: false,
      });
    } catch (err) {
      console.error('Fetch Board Details Error:', err);
      set({ board: null, columns: [], tasks: [], error: err.response?.data?.message || err.message, loading: false });
    }
  },

  addTask: async (taskData) => {
    try {
      const res = await API.post('/tasks', taskData);
      const createdTask = res.data.task || res.data;

      // কলাম আইডি ও বোর্ড আইডি নরম্যালাইজ
      const normalizedTask = {
        ...createdTask,
        columnId: (createdTask.columnId?._id || createdTask.columnId || createdTask.column?._id || createdTask.column || taskData.columnId)?.toString(),
        boardId: (createdTask.boardId?._id || createdTask.boardId || createdTask.board || taskData.boardId)?.toString(),
      };

      set((state) => {
        // ডুপ্লিকেট টাস্ক প্রতিরোধ
        const exists = state.tasks.some((t) => t._id?.toString() === normalizedTask._id?.toString());
        if (exists) return state;
        return { tasks: [...state.tasks, normalizedTask] };
      });

      return normalizedTask;
    } catch (err) {
      console.error('Add Task Store Error:', err);
      throw err;
    }
  },

  moveTask: async (taskId, sourceColId, destColId, newIndex) => {
    const prevTasks = get().tasks;
    set((state) => ({
      tasks: orderTasksAfterMove(state.tasks, taskId, destColId, newIndex),
    }));

    try {
      await API.put(`/tasks/${taskId}/move`, {
        columnId: destColId,
        order: newIndex,
      });
    } catch (err) {
      console.error('Move Task Error:', err);
      set({ tasks: prevTasks });
      throw err;
    }
  },

  deleteTask: async (taskId) => {
    try {
      await API.delete(`/tasks/${taskId}`);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id?.toString() !== taskId?.toString()),
      }));
    } catch (err) {
      console.error('Delete Task Error:', err);
    }
  },

  handleTaskCreatedRemote: (newTask) => {
    const taskObj = newTask.task || newTask;
    const normalizedTask = {
      ...taskObj,
      columnId: (taskObj.columnId?._id || taskObj.columnId || taskObj.column?._id || taskObj.column)?.toString(),
    };
    set((state) => {
      if (state.tasks.some((t) => t._id?.toString() === normalizedTask._id?.toString())) {
        return state;
      }
      return { tasks: [...state.tasks, normalizedTask] };
    });
  },

  handleTaskMovedRemote: ({ taskId, columnId, order, destinationColumnId, newOrder }) => {
    const destinationId = destinationColumnId || columnId;
    const destinationOrder = newOrder ?? order;
    set((state) => ({
      tasks: orderTasksAfterMove(state.tasks, taskId, destinationId, destinationOrder),
    }));
  },

  handleTaskDeletedRemote: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t._id?.toString() !== taskId?.toString()),
    }));
  },
}));