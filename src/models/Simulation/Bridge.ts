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

    public handleCSTPPackage(pkg: SimulationPackage) {
        // case content.mst
        if(pkg.content.mst){
            // get create my mst + Routing Table
            pkg.content.mst = [...pkg.content.mst];
            this.finishMST(pkg.content.mst);
            this.dumpChanges();
            // if i am not destination send to nextHop
            if(pkg.destination !== this.name){
                pkg.target = this.ROUTING_TABLE.find(i => i.target === pkg.destination).nextHop;
                this.send(pkg);
            }
        }
        if (this.INDEXED || this.rootOfIndexing &&  pkg.content.from)
            return;
        if (this.DISCOVERED_LINKS.length === 0 && !this.rootOfIndexing) {
            this.connection.ping.then(bridges => {
                this.WAITING_FOR_BRIDGES = bridges.filter(name => name !== pkg.content.from.name);
                this.dumpChanges();
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
                        this.MST = mst;
                        this.ROUTING_TABLE = this.MST.getRoutingTable(this.name);
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
        }
        if (this.WAITING_FOR_BRIDGES && !!pkg.content.discoveredLinks) {
            const name = pkg.content.discoveredLinks[0].nodes.find(n => n.name !== this.name);
            this.WAITING_FOR_BRIDGES.splice(this.WAITING_FOR_BRIDGES.findIndex(n => n === name), 1);
            this.DISCOVERED_LINKS.push(...pkg.content.discoveredLinks);
        } else if (this.WAITING_FOR_BRIDGES && pkg.content.from) {
            this.WAITING_FOR_BRIDGES.splice(this.WAITING_FOR_BRIDGES.findIndex(n => n === pkg.content.from.name), 1);
            this.returnTo.push(pkg.content.from.name);
            this.DISCOVERED_LINKS.push({
                cost: pkg.cost,
                nodes: [{name: this.name, value: this.value}, pkg.content.from]
            });
        }
        this.dumpChanges();

        if (!!this.WAITING_FOR_BRIDGES && this.WAITING_FOR_BRIDGES.length === 0) {
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
            if (!this.rootOfIndexing) {
                this.connection.finishedIndexing.next();
            } else {
                const links = [];
                this.DISCOVERED_LINKS.forEach(l => {
                    if (!links.find(link => l.nodes.findIndex(n => n.name === link.nodes[0].name) !== -1 && l.nodes.findIndex(n => n.name === link.nodes[1].name) !== -1)) {
                        links.push(l);
                    }
                });
                let linksMst = [...links];
                this.finishMST(linksMst);
                this.ROUTING_TABLE.forEach((item:RoutingTableEntry)=> {
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
            this.dumpChanges();
        }
    }
    private finishMST(links){
        const mst = new MinimalSpanTree(links);
        this.MST = mst;
        this.ROUTING_TABLE = this.MST.getRoutingTable(this.name);
        this.connection.finishedIndexing.next(mst);
    }

    public receive(pkg: SimulationPackage) {
        if (pkg.protocol === 'CSTP') {
            this.handleCSTPPackage(pkg);
        } else {
            this.handlePackage(pkg);
        }
    }

    private handlePackage(pkg: SimulationPackage) {
        if(this.name === pkg.destination){
            alert(this.name+ " received a pkg with: " +pkg.content);
        }else {
            pkg.target = this.ROUTING_TABLE.find(i => i.target === pkg.destination).nextHop;
            this.send(pkg);
        }
    }
}
