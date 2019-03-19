import {RoutingTableEntry} from "./Bridge";

export interface SimulationPackage {
    protocol: string,
    content: any,
    target: string,
    destination?: string,
    cost?: number
    sender?: string;
}

export class SimulationPackage implements SimulationPackage {
    cost?: number;
    destination?: string;

    constructor(public protocol: string, public content: any, public target: string, routingTable: RoutingTableEntry[]) {
        this.destination = target;
        let routingTableEntry = routingTable.find(i => i.target === this.target);
        if(!routingTableEntry){
            debugger;
        }
        this.target = routingTableEntry.nextHop;
    }
}

