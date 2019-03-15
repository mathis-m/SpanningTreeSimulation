import {SpanningTreeNode} from "../SpanningTree/spanningTreeNode";
import {Bridge} from "./Bridge";
import {SimulationConnection} from "./SimulationConnection";
import {SimulationPackage} from "./SimulationPackage";
import {MinimalSpanTree} from "../SpanningTree/minimalSpanningTree";
import {SpanningTreeLink} from "../SpanningTree/spanningTreeLink";

export class Simulation {
    public bridges: Bridge[] = [];
    constructor(public nodes: SpanningTreeNode[]) {
        nodes.forEach(node => {
            let siblingNodes = node.links.map(l => l.toNode);
            const conn = new SimulationConnection(siblingNodes);
            this.bridges.push(new Bridge(node.name, node.value, conn));
        });
        // allow communication between direct connected bridges
        this.bridges.forEach(bridge => {
            let links: SpanningTreeLink[] = nodes.find(n => n.name === bridge.name).links;
            let siblingNodes = links.map(l => l.toNode);
            bridge.connection.send.subscribe((pkg: SimulationPackage) => {
                console.log(`${bridge.name}>>>${pkg.target}`);
                let connectedNode = siblingNodes.find(n => n === pkg.target);
                if (!!connectedNode) {
                    pkg.cost = links.find(l => l.toNode === pkg.target).cost;
                    setTimeout(() => 
                            this.bridges
                            .find(b => b.name === pkg.target)
                            .connection.receive.next(pkg),
                        pkg.cost*1000);
                }
            });
        });
    }

    public startIndexingFromRandomBridge: () => Promise<MinimalSpanTree> = () => {
        return new Promise<MinimalSpanTree>(async resolve => {
            const bridge = this.bridges[Math.round(Math.random() * this.bridges.length)];
            console.log(this.bridges, bridge);
            bridge.connection.finishedIndexing.subscribe((mst) => resolve(mst));
            bridge.indexNetwork().then(()=> console.log('wtf'));
        });
    }
}
