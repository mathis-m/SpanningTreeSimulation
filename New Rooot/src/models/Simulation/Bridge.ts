import {SimulationConnection} from "./SimulationConnection";
import {SimulationPackage} from "./SimulationPackage";

export class Bridge {
	// Bridge data
	public name: string;
	public value: number;

	// Data discovered
	public known_ROOT_ID?: string;
	public known_NEXT_HOP_TO_ROOT?: string;
	public known_COST_TO_ROOT?: number;

	// data for CentralSpanningTreeProtocol
	public INDEXED: boolean;
	public DISCOVERED_LINKS: {
		nodes: string[]; // my name and a connected bridges name
		cost: number; // cost to reach the bridge
	}[];

	// simulation Connection
	public connection: SimulationConnection;

	constructor(name: string, value: number, connection: SimulationConnection){
		this.name = name;
		this.value = value;
		this.connection = connection;
		this.connection.receive.subscribe(this.receive);
	}

	public receive(pkg: SimulationPackage){

	}
	public send(pkg: SimulationPackage){
		this.connection.send.next(pkg);
	}

}
