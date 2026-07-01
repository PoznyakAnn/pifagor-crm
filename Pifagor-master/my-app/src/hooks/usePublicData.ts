import { useEffect, useState } from "react";
import {
  fetchFaq,
  fetchPrices,
  fetchReviews,
  fetchSubjects,
  fetchTutors,
  getLessonPrice,
} from "../api/public";
import type { ApiFaq, ApiPrice, ApiReview, ApiSubject, ApiTutor } from "../api/types";
import { filterAllowedSubjects } from "../utils/subjects";

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

function initialState<T>(data: T): AsyncState<T> {
  return { data, loading: true, error: null };
}

export function useSubjects() {
  const [state, setState] = useState(initialState<ApiSubject[]>([]));

  useEffect(() => {
    let cancelled = false;
    fetchSubjects()
      .then((data) => {
        if (!cancelled) setState({ data: filterAllowedSubjects(data), loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : "Ошибка загрузки",
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useTutors() {
  const [state, setState] = useState(initialState<ApiTutor[]>([]));

  useEffect(() => {
    let cancelled = false;
    fetchTutors()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : "Ошибка загрузки",
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useFaq(subjectId?: number) {
  const [state, setState] = useState(initialState<ApiFaq[]>([]));

  useEffect(() => {
    let cancelled = false;
    fetchFaq(subjectId)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : "Ошибка загрузки",
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  return state;
}

export function useReviews(tutorId?: number) {
  const [state, setState] = useState(initialState<ApiReview[]>([]));

  useEffect(() => {
    let cancelled = false;
    fetchReviews(tutorId)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : "Ошибка загрузки",
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tutorId]);

  return state;
}

export function usePrices(subjectId?: number, fallback = 40) {
  const [state, setState] = useState(initialState<ApiPrice[]>([]));

  useEffect(() => {
    let cancelled = false;
    fetchPrices(subjectId)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : "Ошибка загрузки",
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  const lessonPrice = getLessonPrice(state.data) ?? fallback;
  return { ...state, lessonPrice };
}
