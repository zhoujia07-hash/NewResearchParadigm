import type {HumanSnapshot} from '../models/human/types';
import type {EnvironmentState} from '../models/environment/types';
import type {MachineState} from '../models/machine/types';
import type {MobilityMode} from '../models/mobility/types';
import type {Extensions,Provenance} from '../models/shared';

export interface SimulationTime {
  readonly elapsedSeconds:number;
  readonly clock:'scripted'|'simulation'|'observed';
  /** Clock suspension, distinct from a renderer freezing avatar motion. */
  readonly paused:boolean;
}
/** Population and venue agnostic. An absent measurement is not zero. */
export interface SystemState {
  readonly schemaVersion:'hme/1';
  readonly humans:readonly HumanSnapshot[];
  readonly environment:EnvironmentState;
  readonly machine:MachineState;
  readonly mobility:Readonly<Record<string,MobilityMode>>;
  readonly time:SimulationTime;
  readonly context:{readonly studyId:string;readonly taskId:string;readonly provenance:Provenance;readonly extensions:Extensions};
}
