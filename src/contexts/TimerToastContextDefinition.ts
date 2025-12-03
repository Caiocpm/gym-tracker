// src/contexts/TimerToastContextDefinition.ts
import { createContext } from "react";
import type { TimerToastContextType } from "../types/timerToast";

export const TimerToastContext = createContext<
  TimerToastContextType | undefined
>(undefined);
