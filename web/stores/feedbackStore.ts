import { create } from "zustand";
import { ApiError } from "../lib/api";

type FeedbackState = {
  errorMessage: string;
  successMessage: string;
  clearFeedback: () => void;
  setSuccess: (message: string) => void;
  setError: (error: unknown) => void;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
};

export const useFeedbackStore = create<FeedbackState>((set) => ({
  errorMessage: "",
  successMessage: "",
  clearFeedback: () => set({ errorMessage: "", successMessage: "" }),
  setSuccess: (message) => set({ errorMessage: "", successMessage: message }),
  setError: (error) =>
    set({
      successMessage: "",
      errorMessage: getErrorMessage(error)
    })
}));
