import {SimulationConnection} from "./SimulationConnection";
import {SimulationPackage} from "./SimulationPackage";
import {MinimalSpanTree} from "../SpanningTree/minimalSpanningTree";
import {tryResolvePackage} from "tslint/lib/utils";

export class Bridge {
    public rootOfIndexing = false;
    public returnTo: string[] = [];
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
        nodes: { name: string, value: number }[]; // my name and a connected bridges name
        cost: number; // cost to reach the bridge
    }[] = [];

    private WAITING_FOR_BRIDGES: string[];

    // simulation Connection
    public connection: SimulationConnection;
    private dumpChanges: () => void;
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
        this.connection.send.next(pkg);
    }

    public handleCSTPPackage(pkg: SimulationPackage) {
        if (this.INDEXED || this.rootOfIndexing &&  pkg.content.from)
            return;
        console.log(this.name, 'received pkg');
        if (this.DISCOVERED_LINKS.length === 0 && !this.rootOfIndexing) {
            this.connection.ping.then(bridges => {
                this.WAITING_FOR_BRIDGES = bridges.filter(name => name !== pkg.content.from.name);
                this.dumpChanges();
                console.log(this.name, " waiting for:", this.WAITING_FOR_BRIDGES);
                this.WAITING_FOR_BRIDGES.forEach(target => this.send({
                    protocol: 'CSTP',
                    content: {
                        message: 'Dear Neighbor hear is my name and the package provides you the cost to me. Follow the CSTP.',
                        from: {name: this.name, value: this.value}
                    },
                    target
                }));
                if (this.WAITING_FOR_BRIDGES.length === 0) {
                    const returnTo = this.DISCOVERED_LINKS[0].nodes.find(n => n.name !== this.name);
                    this.dumpChanges();

                    this.send({
                        protocol: 'CSTP',
                        content: {
                            message: 'Dear Neighbor hear are my discovered links, you may concat them with yours and send them back!',
                            discoveredLinks: this.DISCOVERED_LINKS
                        },
                        target: returnTo.name
                    });
                    this.INDEXED = true;
                    if (!this.rootOfIndexing) {
                        this.connection.finishedIndexing.next();
                    } else {
                        const mst = new MinimalSpanTree(this.DISCOVERED_LINKS);
                        this.connection.finishedIndexing.next(mst);
                    }
                    this.dumpChanges();
                }
            });
            this.DISCOVERED_LINKS.push({
                cost: pkg.cost,
                nodes: [{name: this.name, value: this.value}, pkg.content.from]
            });
            this.returnTo.push(pkg.content.from.name);
            this.dumpChanges();

            console.log("returning from ", this.name, "to ", this.returnTo);

        }
        if (this.WAITING_FOR_BRIDGES && !!pkg.content.discoveredLinks) {
            const name = pkg.content.discoveredLinks[0].nodes.find(n => n.name !== this.name);
            this.WAITING_FOR_BRIDGES.splice(this.WAITING_FOR_BRIDGES.findIndex(n => n === name), 1);
            console.log(this.name, " waiting for:", this.WAITING_FOR_BRIDGES);
            this.DISCOVERED_LINKS.push(...pkg.content.discoveredLinks);
        } else if (this.WAITING_FOR_BRIDGES && pkg.content.from) {
            this.WAITING_FOR_BRIDGES.splice(this.WAITING_FOR_BRIDGES.findIndex(n => n === pkg.content.from.name), 1);
            console.log(this.name, " waiting for:", this.WAITING_FOR_BRIDGES);
            this.returnTo.push(pkg.content.from.name);
            console.log("returning from ", this.name, "to ", this.returnTo);
            this.DISCOVERED_LINKS.push({
                cost: pkg.cost,
                nodes: [{name: this.name, value: this.value}, pkg.content.from]
            });
        }
        this.dumpChanges();

        if (!!this.WAITING_FOR_BRIDGES && this.WAITING_FOR_BRIDGES.length === 0) {
            console.log(this.name, 'sending', this.DISCOVERED_LINKS);
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
            this.INDEXED = true;
            console.log('Node has finished ', this.name);
            if (!this.rootOfIndexing) {
                this.connection.finishedIndexing.next();
            } else {
                const links = [];
                this.DISCOVERED_LINKS.forEach(l => {
                    if (!links.find(link => l.nodes.findIndex(n => n.name === link.nodes[0].name) !== -1 && l.nodes.findIndex(n => n.name === link.nodes[1].name) !== -1)) {
                        links.push(l);
                    }
                });
                console.log('dl', this.DISCOVERED_LINKS.map(l => l.nodes));
                console.log('l', links);
                const mst = new MinimalSpanTree(links);
                this.connection.finishedIndexing.next(mst);
            }
            this.dumpChanges();
        }
    }

    public receive(pkg: SimulationPackage) {
        if (pkg.protocol === 'CSTP') {
            this.handleCSTPPackage(pkg);
        }
    }
}
