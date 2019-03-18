import {SimulationPackage} from "./SimulationPackage";
import {Subject} from "rxjs";
import {MinimalSpanTree} from "../SpanningTree/minimalSpanningTree";

export class SimulationConnection{
	// a Bridge can do conn.send.next(pkg)
	// and the simulation does conn.send.subscribe and provides a handler that only allows to send to direct connected bridges
	public send: Subject<SimulationPackage> = new Subject<SimulationPackage>();
	// a Bridge can subscribe to the receive Subject and the cb gets called if the simulation redirects that send.next from a other bridge to you
	public receive: Subject<SimulationPackage> = new Subject<SimulationPackage>();
	// returns direct Connected Bridges
	public ping: Promise<string[]>;
	constructor(siblingBridges: string[]){
		this.ping = new Promise<string[]>(resolve => resolve(siblingBridges));
	}
	// only for the simulation
	public finishedIndexing: Subject<MinimalSpanTree|any> = new Subject();
}
