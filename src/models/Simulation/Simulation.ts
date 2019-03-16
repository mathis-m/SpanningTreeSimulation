import {SpanningTreeNode} from "../SpanningTree/spanningTreeNode";
import {Bridge} from "./Bridge";
import {SimulationConnection} from "./SimulationConnection";
import {SimulationPackage} from "./SimulationPackage";
import {MinimalSpanTree} from "../SpanningTree/minimalSpanningTree";
import {SpanningTreeLink} from "../SpanningTree/spanningTreeLink";

export class Simulation {
    public bridges: Bridge[] = [];

    constructor(public nodes: SpanningTreeNode[], multiplicatorForCostInSeconds = 0.5) {
        const target = document.getElementById('container_target') as HTMLDivElement;
        target.childNodes.forEach(n => n.remove());
        target.childNodes.forEach(n => n.remove());
        target.childNodes.forEach(n => n.remove());
        const initialPackagesTemplate =`
<div class="item" id="init_pkg">
    <h3>Packages:</h3>
    <div id="pkg_s_target">

    </div>
</div>
`;
        target.insertAdjacentElement("beforeend", new DOMParser().parseFromString(initialPackagesTemplate, "text/html").getElementById(`init_pkg`));
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
        const target = document.getElementById('container_target') as HTMLDivElement;
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
            target.insertAdjacentElement("beforeend", new DOMParser().parseFromString(bridgeTemplate(bridge), "text/html").getElementById(`bridge_${bridge.value}`));
        })
    }

    dumpBridge(bridge: Bridge) {
        const bridgeTemplate = (bridge: Bridge) => `
<div class="item" id="bridge_${bridge.value}">
    <div style="width: 100%; height: 100%; overflow-y: auto">
        <h3>Bridge ${bridge.name}</h3>
        ${bridge.rootOfIndexing?'Indexing Root!': ''}<br>
        Known links: [<br><BLOCKQUOTE>${bridge.DISCOVERED_LINKS.map(l => l.nodes.map(n => n.name).join('-') + ':' + l.cost).join(',<br>')}</BLOCKQUOTE><br>]<br>
        ${!bridge.rootOfIndexing && bridge.INDEXED ? `Node has finished indexing!<br>Returning Data to: [<br><BLOCKQUOTE>${bridge.returnTo.join(',<br>')}</BLOCKQUOTE><br>]`: ''}
        ${bridge.rootOfIndexing && bridge.INDEXED ? `Network has finished indexing!<br>MST generated.<br>Sending MST to: [<br><BLOCKQUOTE>${bridge.MST.allNodes.map(n => n.name).filter(s => s !== bridge.name).join(',<br>')}</BLOCKQUOTE><br>]`: ''}
        
    </div>
</div>
`;
        const el = document.getElementById(`bridge_${bridge.value}`);
        el.replaceWith(new DOMParser().parseFromString(bridgeTemplate(bridge), "text/html").getElementById(`bridge_${bridge.value}`))
    }

}
