import {SpanningTreeNode} from "../SpanningTree/spanningTreeNode";
import {Bridge} from "./Bridge";
import {SimulationConnection} from "./SimulationConnection";
import {SimulationPackage} from "./SimulationPackage";

export class Simulation {
	public bridges: Bridge[];
	constructor(public nodes: SpanningTreeNode[]){
		nodes.forEach(node => {
			let siblingNodes = node.links.map(l => l.toNode);
			const conn = new SimulationConnection(siblingNodes);
			this.bridges.push(new Bridge(node.name, node.value, conn));
		});
		// allow communication between direct connected bridges
		this.bridges.forEach(bridge => {
			let siblingNodes = nodes.find(n => n.name === bridge.name).links.map(l => l.toNode);
			bridge.connection.send.subscribe((pkg: SimulationPackage) => {
				if(siblingNodes.findIndex(n => n === pkg.target)){
					this.bridges.find(b => b.name === pkg.target).connection.receive.next(pkg);
				}
			});
		});
	}

}
