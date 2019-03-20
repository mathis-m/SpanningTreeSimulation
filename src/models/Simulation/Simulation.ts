import {SpanningTreeNode} from "../SpanningTree/spanningTreeNode";
import {Bridge} from "./Bridge";
import {SimulationConnection} from "./SimulationConnection";
import {SimulationPackage} from "./SimulationPackage";
import {MinimalSpanTree} from "../SpanningTree/minimalSpanningTree";
import {SpanningTreeLink} from "../SpanningTree/spanningTreeLink";
import * as view from "../view/SimulationView";

export class Simulation {
    public bridges: Bridge[] = [];

    constructor(public nodes: SpanningTreeNode[], private multiForCostInSeconds = 0.5) {
        view.init();
        // foreach node create a Bridge with a connection
        nodes.forEach(node => {
            // create Connection
            let siblingNodes = node.links.map(l => l.toNode);
            const conn = new SimulationConnection(siblingNodes);
            // push new bridge
            this.bridges.push(new Bridge(node.name, node.value, conn, (bridge) => view.dumpBridge(bridge, this.bridges)));
        });
        // allow communication between direct connected bridges
        this.bridges.forEach(bridge => {
            let links: SpanningTreeLink[] = nodes.find(n => n.name === bridge.name).links;
            let siblingNodes = links.map(l => l.toNode);
            bridge.connection.send.subscribe((pkg: SimulationPackage) => {
                let connectedNode = siblingNodes.find(n => n === pkg.target);
                if (!!connectedNode) {
                    pkg.cost = links.find(l => l.toNode === pkg.target).cost;
                    const cb = view.dumpPkg(pkg, bridge.name);
                    setTimeout(() => {
                            cb();
                            this.bridges
                                .find(b => b.name === pkg.target)
                                .connection.receive.next(pkg);
                        },
                        pkg.cost * 1000 * this.multiForCostInSeconds);
                }
            });
        });
        view.createDomBridges(this.bridges);
    }

    public startIndexingFromRandomBridge: () => Promise<MinimalSpanTree> = () => {
        // as the protocol says send a CSTP package to all direct connected Bridges
        return new Promise<MinimalSpanTree>(async resolve => {
            let rndm = Math.round(Math.random() * this.bridges.length);
            if(rndm < 0 && rndm > this.bridges.length - 1){
                rndm = 0;
            }
            const bridge = this.bridges[rndm];
            bridge.connection.finishedIndexing.subscribe((mst) => resolve(mst));
            await bridge.indexNetwork();
        });
    };
}
