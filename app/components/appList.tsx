import { lazy } from "react";
import { Game } from "../types";

// Lazy load the games components
const WordFactory = lazy(() => import("./WordFactory"));
const ScheduleFinder = lazy(() => import("../apps/ScheduleFinder/ScheduleFinder"));

export const appList: Game[] = [
  {
    id: 'word-factory',
    title: 'Word Factory',
    description: 'Create words from a set of letters in this fun word game!',
    component: WordFactory
  },
  {
    id: 'scheduleFinder',
    title: 'Schedule Finder',
    description: 'Find common schedule with your friends',
    component: ScheduleFinder
  }
];