export const NAVIGATION_TASKS=['route-following','free-wayfinding','search','pointing','map-learning','route-learning','return-navigation','imagined-navigation','memory-retrieval'] as const;
export type NavigationTaskType=typeof NAVIGATION_TASKS[number];
export interface NavigationTask {readonly id:string;readonly type:NavigationTaskType;readonly description:string;readonly goalId?:string}
