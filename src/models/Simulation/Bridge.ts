import {SimulationConnection} from "./SimulationConnection";
import {SimulationPackage} from "./SimulationPackage";
import {MinimalSpanTree} from "../SpanningTree/minimalSpanningTree";

export interface RoutingTableEntry {
    target: string;
    nextHop: string;
}

export class Bridge {
    // Bridge data
    public name: string;
    public value: number;

    // Data discovered
    public MST: MinimalSpanTree;

    // data for CentralSpanningTreeProtocol
    public INDEXED: boolean;
    public BLOCKED: () => boolean = () => !this.MST;
    public DISCOVERED_LINKS: {
        nodes: { name: string, value: number }[]; // my name and a connected bridges name
        cost: number; // cost to reach the bridge
    }[] = [];
    public ROUTING_TABLE: RoutingTableEntry[];

    private WAITING_FOR_BRIDGES: string[];

    // for view
    public rootOfIndexing = false;
    public returnTo: string[] = [];

    // simulation Connection
    public connection: SimulationConnection;
    private readonly dumpChanges: () => void;

    constructor(name: string, value: number, connection: SimulationConnection, dumpChanges: (b) => void) {
        this.name = name;
        this.value = value;
        this.connection = connection;
        this.connection.receive.subscribe((pkg) => this.receive(pkg));
        this.dumpChanges = () => dumpChanges(this);
    }

    public async indexNetwork() {
        this.rootOfIndexing = true;
        this.dumpChanges();
        let siblings = (await this.connection.ping);
        this.WAITING_FOR_BRIDGES = siblings;
        siblings.forEach(target => {
            this.send({
                protocol: 'CSTP',
                content: {
                    message: 'Dear Neighbor hear is my name and the package provides you the cost to me. Follow the CSTP.',
                    from: {name: this.name, value: this.value}
                },
                target
            });
        });
    }

    public send(pkg: SimulationPackage) {
        pkg.sender = this.name;
        this.connection.send.next(pkg);
    }

    public receive(pkg: SimulationPackage) {
        if (pkg.protocol === 'CSTP') {
            this.handleCSTPPackage(pkg).then(() => {
            });
        } else {
            this.handlePackage(pkg);
        }
    }

    private handlePackage(pkg: SimulationPackage) {
        if (this.name === pkg.destination) {
            alert(this.name + " received a pkg with: " + pkg.content);
        } else {
            pkg.target = this.ROUTING_TABLE.find(i => i.target === pkg.destination).nextHop;
            this.send(pkg);
        }
    }

    public async handleCSTPPackage(pkg: SimulationPackage) {
        const cstpCase = this.buildCase(pkg.content);
        // if mst share build mst and routing table
        if (cstpCase.id === 3) {
            this.handleCase3(pkg, cstpCase);
        } else {
            // if case 1 and first Incoming pkg and not root of indexing
            if (this.DISCOVERED_LINKS.length === 0 && !this.rootOfIndexing && cstpCase.id === 1) {
                // spread to all direct connected bridges except where the pkg came from.
                await this.spread(pkg);
                this.dumpChanges();
            }
            // if package contains link(s) info and waiting for that bridge
            if (((cstpCase.id === 1 && !this.rootOfIndexing) || cstpCase.id === 2) && this.WAITING_FOR_BRIDGES.indexOf(pkg.sender) !== -1) {
                this.handleReturnedInfoFromSpread(cstpCase, pkg);
                this.dumpChanges();
            }
            // add new returning to bridge
            if (cstpCase.id === 1 && !this.rootOfIndexing) {
                this.returnTo.push(cstpCase.content.name);
                this.dumpChanges();
            }
            // if all direct connection are known
            if (!!this.WAITING_FOR_BRIDGES && this.WAITING_FOR_BRIDGES.length === 0) {
                this.handleSpreadFinished();
                this.dumpChanges();
            }
        }
    }

    private buildCase(content: any) {
        const CASE_CSTP = [
            // in case...
            content.from, //  .............1 the package contains a single discovered link (outgoing CSTP to request a spread)
            content.discoveredLinks, // ...2 the package is a Return from a requested spread (multiple discovered links)
            content.mst, //   .............3 the package contains the full set of links to create the mst
        ];
        const id = CASE_CSTP.findIndex(c => !!c === true) + 1;
        content = CASE_CSTP[id - 1];
        return {
            id,
            content
        }
    }

    public handleCase3(pkg: SimulationPackage, cstpCase) {
        this.finishMST(cstpCase.content);
        // if this bridge isn't the destination of the pkg
        if (pkg.destination !== this.name) {
            // send pkg tto nextHop
            pkg.target = this.ROUTING_TABLE.find(i => i.target === pkg.destination).nextHop;
            this.send(pkg);
        }
    }

    public async spread(pkg: SimulationPackage) {
        // therefore we need to know all connected Bridges
        const connectedBridges = await this.connection.ping;
        // and we need to save them
        this.WAITING_FOR_BRIDGES = connectedBridges.filter(name => name !== pkg.content.from.name);
        // spread
        this.WAITING_FOR_BRIDGES.forEach(target => this.send({
            protocol: 'CSTP',
            content: {
                message: 'Dear Neighbor hear is my name and the package provides you the cost to me. Follow the CSTP.',
                from: {name: this.name, value: this.value}
            },
            target
        }));
    }

    private handleReturnedInfoFromSpread(cstpCase, pkg) {
        // remove sender from waiting for
        this.WAITING_FOR_BRIDGES.splice(this.WAITING_FOR_BRIDGES.findIndex(n => n === pkg.sender), 1);
        let t = cstpCase.content;
        if (cstpCase.id === 1) {
            t = [{
                cost: pkg.cost,
                nodes: [{name: this.name, value: this.value}, t]
            }];
        }
        // save link(s)
        this.DISCOVERED_LINKS.push(...t);
    }

    private finishMST(links) {
        const mst = new MinimalSpanTree(links);
        this.MST = mst;
        this.ROUTING_TABLE = this.MST.getRoutingTable(this.name);
        this.connection.finishedIndexing.next(mst);
    }

    private handleSpreadFinished() {
        this.sendDiscoveredLinksBack();
        this.INDEXED = true;
        if (!this.rootOfIndexing) {
            this.connection.finishedIndexing.next();
        } else {
            this.shareMst();
        }
    }

    private shareMst() {
        let linksMst = this.getLinks();
        this.finishMST(linksMst);
        this.ROUTING_TABLE.forEach((item: RoutingTableEntry) => {
            this.send({
                protocol: 'CSTP',
                content: {
                    message: 'Dear Neighbor hear is my name and the package provides you the cost to me. Follow the CSTP.',
                    mst: linksMst
                },
                target: item.nextHop,
                destination: item.target
            });
        });
    }

    private getLinks() {
        const links = [];
        this.DISCOVERED_LINKS.forEach(l => {
            if (!links.find(link => l.nodes.findIndex(n => n.name === link.nodes[0].name) !== -1 && l.nodes.findIndex(n => n.name === link.nodes[1].name) !== -1)) {
                links.push(l);
            }
        });
        return [...links];
    }

    private sendDiscoveredLinksBack() {
        this.returnTo.forEach(target => {
            this.send({
                protocol: 'CSTP',
                content: {
                    message: 'Dear Neighbor hear are my discovered links, you may concat them with yours and send them back!',
                    discoveredLinks: this.DISCOVERED_LINKS
                },
                target
            });
        });
    }
}
