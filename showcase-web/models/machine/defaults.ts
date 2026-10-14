import type {MachineState} from './types';
/** Structural empty loop, not an intervention algorithm. */
export function unspecifiedMachine():MachineState {
  return {platforms:[],sensing:[],detection:{human:[],environment:[],diagnostics:{}},capabilities:[],
    decision:{status:'none',source:'prototype',intervention:null,reason:'No policy evaluated'},
    interaction:{phase:'sense',availableActions:[],operatorResponse:null,feedback:[]},extensions:{}};
}
