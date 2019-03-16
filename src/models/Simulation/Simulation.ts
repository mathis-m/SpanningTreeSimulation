import {SpanningTreeNode} from "../SpanningTree/spanningTreeNode";
import {Bridge} from "./Bridge";
import {SimulationConnection} from "./SimulationConnection";
import {SimulationPackage} from "./SimulationPackage";
import {MinimalSpanTree} from "../SpanningTree/minimalSpanningTree";
import {SpanningTreeLink} from "../SpanningTree/spanningTreeLink";

export class Simulation {
    public bridges: Bridge[] = [];

    constructor(public nodes: SpanningTreeNode[], multiplicatorForCostInSeconds = 0.5) {
        nodes.forEach(node => {
            let siblingNodes = node.links.map(l => l.toNode);
            const conn = new SimulationConnection(siblingNodes);
            this.bridges.push(new Bridge(node.name, node.value, conn, this.dumpBridge));
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
                    const cb = this.dumpPkg(pkg, bridge.name);
                    setTimeout(() => {
                            cb();
                            this.bridges
                                .find(b => b.name === pkg.target)
                                .connection.receive.next(pkg);
                        },
                        pkg.cost * 1000 * multiplicatorForCostInSeconds);
                }
            });
        });
        this.createDomBridges();
    }

    public startIndexingFromRandomBridge: () => Promise<MinimalSpanTree> = () => {
        return new Promise<MinimalSpanTree>(async resolve => {
            const bridge = this.bridges[Math.round(Math.random() * this.bridges.length)];
            console.log(this.bridges, bridge);
            bridge.connection.finishedIndexing.subscribe((mst) => resolve(mst));
            bridge.indexNetwork().then(() => console.log('wtf'));
        });
    };
    private id = 0;

    private dumpPkg(pkg: SimulationPackage, from: string): () => void {

        const pkg_s_target = document.getElementById('pkg_s_target') as HTMLDivElement;

        let number = this.id++;
        const pkgTemplate = (pkg: SimulationPackage, from: string) => `
<div id="pkg_${number}">
    ${from} -> ${pkg.target} : ${pkg.cost}
</div>
`;
        pkg_s_target.insertAdjacentElement("beforeend", new DOMParser().parseFromString(pkgTemplate(pkg, from), "text/html").getElementById(`pkg_${number}`));
        //pkg_s_target.(new DOMParser().parseFromString(pkgTemplate(pkg, from), "text/html").getElementById(`pkg_${number}`));
        return () => {
            pkg_s_target.removeChild(document.getElementById(`pkg_${number}`));
        };
    }

    createDomBridges() {
        const pkg_s_target = document.getElementById('container_target') as HTMLDivElement;
        const bridgeTemplate = (bridge: Bridge) => `
<div class="item" id="bridge_${bridge.value}">
    <h3>Bridge ${bridge.name}</h3>
</div>
`;
        this.bridges.sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        }).forEach(bridge => {
            pkg_s_target.insertAdjacentElement("beforeend", new DOMParser().parseFromString(bridgeTemplate(bridge), "text/html").getElementById(`bridge_${bridge.value}`));
        })
    }

    dumpBridge(bridge: Bridge) {
        const bridgeTemplate = (bridge: Bridge) => `
<div class="item" id="bridge_${bridge.value}">
    <div style="width: 100%; height: 100%; overflow-y: auto">
        <h3>Bridge ${bridge.name}</h3>
        ${bridge.rootOfIndexing?'Indexing Root!': ''}<br>
        Known links: [<BLOCKQUOTE>${bridge.DISCOVERED_LINKS.map(l => l.nodes.map(n => n.name).join('-') + ':' + l.cost).join(',<br>')}</BLOCKQUOTE>]<br>
        ${!bridge.rootOfIndexing ? `Returning Data to: [<BLOCKQUOTE>${bridge.returnTo.join(',<br>')}</BLOCKQUOTE>]`: ''}
    </div>
</div>
`;
        const el = document.getElementById(`bridge_${bridge.value}`);
        el.replaceWith(new DOMParser().parseFromString(bridgeTemplate(bridge), "text/html").getElementById(`bridge_${bridge.value}`))
    }

}
