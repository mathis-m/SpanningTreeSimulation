import {Subject} from "rxjs";
import {SimulationPackage} from "./SimulationPackage";

export class SimulationConnection{
	public send: Subject<SimulationPackage> = new Subject<SimulationPackage>();
	public receive: Subject<SimulationPackage> = new Subject<SimulationPackage>();
	public ping: Promise<string[]>;
	constructor(siblingBridges: string[]){
		this.ping = new Promise<string[]>(resolve => resolve(siblingBridges));
	}
}
