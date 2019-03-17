import {SpanningTreeNode} from "../SpanningTree/spanningTreeNode";
import {Bridge} from "./Bridge";
import {SimulationConnection} from "./SimulationConnection";
import {SimulationPackage} from "./SimulationPackage";
import {MinimalSpanTree} from "../SpanningTree/minimalSpanningTree";
import {SpanningTreeLink} from "../SpanningTree/spanningTreeLink";

export class Simulation {
    public bridges: Bridge[] = [];

    constructor(public nodes: SpanningTreeNode[], private multiForCostInSeconds = 0.5) {
        const target = document.getElementById('container_target') as HTMLDivElement;
        target.childNodes.forEach(n => n.remove());
        target.childNodes.forEach(n => n.remove());
        target.childNodes.forEach(n => n.remove());
        const initialPackagesTemplate = `
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
            this.bridges.push(new Bridge(node.name, node.value, conn, (bridge) => this.dumpBridge(bridge)));
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
                        pkg.cost * 1000 * this.multiForCostInSeconds);
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
        if (this.bridges.findIndex(b => b.BLOCKED()) === -1) {
            let target = document.getElementById('pkg_test_target') as HTMLDivElement;

            const card = `
<div class="item" id="pkg-card" style="
    display: flex;
    flex-direction: column;
    width: 200%;
">
    <h3>Send a sample package through with the new topology</h3>
</div>
`;
            target.insertAdjacentElement("beforeend", new DOMParser().parseFromString(card, "text/html").getElementById('pkg-card'));
            target = document.getElementById('pkg-card') as HTMLDivElement;
            const values = this.bridges.map(b => b.name);
            const dropdownTemplate = (id: string) => `
<label id="l_${id}" for="${id}">Send ${id}:</label>
<select id="${id}">
    ${values.map(v => `<option value="${v}">${v}</option>
    `)}
</select>
`;
            let dropdown = (id: string) => {
                target.insertAdjacentElement("beforeend", new DOMParser().parseFromString(dropdownTemplate(id) + `<br>`, "text/html").getElementById(`l_${id}`));
                target.insertAdjacentElement("beforeend", new DOMParser().parseFromString(dropdownTemplate(id), "text/html").getElementById(id));
            };
            dropdown('from');
            dropdown('to');
            const button = `
<button id="test_send">Send</button>
`;
            const sendPkg = () => {
                console.log('sending');
                this.multiForCostInSeconds = +(document.getElementById('mult') as HTMLInputElement).value;
                const fromName = (document.getElementById('from') as HTMLSelectElement).value;
                const toName = (document.getElementById('to') as HTMLSelectElement).value;
                let find = this.bridges.find(b => b.name === fromName);
                let simulationPackage = new SimulationPackage('SOME_NORMAL', "Greetings from" + find.name, toName, find.ROUTING_TABLE);
                console.log('here', simulationPackage);
                find.send(simulationPackage);
            };
            target.insertAdjacentElement("beforeend", new DOMParser().parseFromString(button, "text/html").getElementById('test_send'));
            (document.getElementById('test_send') as HTMLButtonElement).addEventListener('click', () => sendPkg())
        }
        const bridgeTemplate = (bridge: Bridge) => `
<div class="item" id="bridge_${bridge.value}" ${!bridge.BLOCKED() ? `style="box-shadow: 5px 5px 4px #33b040 !important;"` : ''}>
    <div style="width: 100%; height: 100%; overflow-y: auto">
        <h3>Bridge ${bridge.name}</h3>
        ${bridge.rootOfIndexing ? 'Indexing Root!' : ''}<br>
        Known links: [<br><BLOCKQUOTE>${bridge.DISCOVERED_LINKS.map(l => l.nodes.map(n => n.name).join('-') + ':' + l.cost).join(',<br>')}</BLOCKQUOTE><br>]<br>
        ${!bridge.rootOfIndexing && bridge.INDEXED ? `<br>Node has finished indexing!<br>Returning Data to: [<br><BLOCKQUOTE>${bridge.returnTo.join(',<br>')}</BLOCKQUOTE><br>]` : ''}
        ${bridge.rootOfIndexing && bridge.INDEXED ? `<br>Network has finished indexing!<br>MST generated.<br>Sending MST to: [<br><BLOCKQUOTE>${bridge.MST.allNodes.map(n => n.name).filter(s => s !== bridge.name).join(',<br>')}</BLOCKQUOTE><br>]` : ''}
        ${!bridge.BLOCKED() ? `<br>Received MST. Routing Table: [<br><BLOCKQUOTE>${bridge.ROUTING_TABLE.map(i => `->${i.target} via ${i.nextHop}`).join(',<br>')}</BLOCKQUOTE><br>]` : ''}
    </div>
</div>
`;
        const el = document.getElementById(`bridge_${bridge.value}`);
        el.replaceWith(new DOMParser().parseFromString(bridgeTemplate(bridge), "text/html").getElementById(`bridge_${bridge.value}`))
    }

}
