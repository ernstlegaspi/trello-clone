"use client";

import { useFeedbackStore } from "../../stores/feedbackStore";

export default function useFeedback() {
  const errorMessage = useFeedbackStore((state) => state.errorMessage);
  const successMessage = useFeedbackStore((state) => state.successMessage);
  const clearFeedback = useFeedbackStore((state) => state.clearFeedback);
  const setSuccess = useFeedbackStore((state) => state.setSuccess);
  const setError = useFeedbackStore((state) => state.setError);

  return {
    errorMessage,
    successMessage,
    clearFeedback,
    setSuccess,
    setError
  };
}
