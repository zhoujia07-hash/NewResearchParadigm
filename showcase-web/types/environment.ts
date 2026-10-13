import type { Place, Story } from '@/lib/story';
export type Point3 = [number, number, number];
export type CameraMode = 'overview' | 'follow';
export type ViewMode = '2d' | '3d';
export interface SpatialNode { name: Place; position: Point3 }
export interface SceneProps {
  story: Story; selected: number; reduced: boolean; compact: boolean;
  cameraMode: CameraMode; onSelect: (index: number) => void;
}
export interface AvatarPose { position: Point3; heading: number; walking: boolean; phase: number }
