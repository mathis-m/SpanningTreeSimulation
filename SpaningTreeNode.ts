import {SpaningTreeLink} from "SpaningTreeLink";
import {Subject} from "rxjs";

export interface INetworkNode {
    ping: () => Promise<string[]>;
    send: (simulationPackage: SimulationPackage) => void;
    receive: Subject<SimulationPackage>;
}

export enum SimulationPackageTypes {
    INFORMATION = 0,
    RETURN_INFORMATION = 1,
    MST_SHARE = 2,
    NORMAL = 3
}

export class SimulationPackage {
    public lastCost = 0;

    constructor(public type: SimulationPackageTypes, public data: any, public nextNode: string, public targetNode: string = nextNode) {
    }
}

export interface ISimulationNetwork {
    directLinkedNodeNames: Promise<string[]>,
    send: Subject<SimulationPackage>;
}

export class SpaningTreeNode implements INetworkNode {
    public knownLinks: SpaningTreeLink[] = [];
    private awaitReturnInformationPackageCounter = null;

    constructor(public name: string, public value: number, public network: ISimulationNetwork) {
        this.receive.subscribe(async (simulationPackage) => await this.handleIncomingPackage(simulationPackage))
    }

    ping = async () => await this.network.directLinkedNodeNames;
    send = (simulationPackage: SimulationPackage) => this.network.send.next(simulationPackage);
    private hasSendInformation = () => this.this.awaitReturnInformationPackageCounter !== null;
    private returnPackage: SimulationPackage;
    private sendNetworkIndexingRequest = async () => {
        const possibleTargets = await this.ping();
        this.awaitReturnInformationPackageCounter = possibleTargets.length;
        possibleTargets.forEach(target => {
            this.send(new SimulationPackage(SimulationPackageTypes.INFORMATION, {
                name: this.name,
                value: this.value,
                hops: [{
                    toNode: this.name,
                    withCost: 0
                }]
            }, target))
        });
    };
    receive: Subject<SimulationPackage> = new Subject();

    private async handleIncomingPackage(simulationPackage: SimulationPackage) {
        // handle information type package
        if (simulationPackage.type === SimulationPackageTypes.INFORMATION) {
            await this.handleInformationPackage(simulationPackage);
        }
        // handle Return package
        else if (simulationPackage.type === SimulationPackageTypes.RETURN_INFORMATION)
        {
            this.handleReturnedInformationPackage(simulationPackage);
        }
        /*else if (simulationPackage.type === SimulationPackageTypes.MST_SHARE)
        {
            this.minimalDiscoveredSpanTree = simulationPackage.data.mst;
            this.handlePackage(simulationPackage);
        }
        else if (simulationPackage.type === SimulationPackageTypes.NORMAL)
        {
            this.handlePackage(simulationPackage);
        }*/
    }

    private async handleInformationPackage(simulationPackage: SimulationPackage) {
        if (this.hasSendInformation()) {
            this.awaitReturnInformationPackageCounter--;
            if (this.awaitReturnInformationPackageCounter !== 0) {
                let toNode = simulationPackage.data.hops[simulationPackage.data.hops.findIndex(h => h.toNode === this.name) - 1].toNode;
                if (!this.returnPackage)
                    this.returnPackage = new SimulationPackage(SimulationPackageTypes.RETURN_INFORMATION, [simulationPackage.data], toNode);
                else
                    this.returnPackage.data.push(simulationPackage.data);
            } else {
                this.send(this.returnPackage);
            }

        } else {
            // get Targets except the one the package came from.
            const possibleTargets = (await this.ping())
                .filter(node => node === simulationPackage.data.hops[simulationPackage.data.hops.length - 1].toNode);
            // set counter for waiting of returns
            if (possibleTargets.length > 1) {
                this.awaitReturnInformationPackageCounter = possibleTargets.length;
            }
            // add information of the hop to me to the package.
            simulationPackage = this.addMyInformation(simulationPackage);
            if (possibleTargets.length === 0) {
                let toNode = simulationPackage.data.hops[simulationPackage.data.hops.findIndex(h => h.toNode === this.name) - 1].toNode;
                this.send(new SimulationPackage(SimulationPackageTypes.RETURN_INFORMATION, [simulationPackage.data], toNode))
            } else {
                // send to all targets
                possibleTargets.forEach(target => {
                    simulationPackage.targetNode = target;
                    this.send(simulationPackage);
                });
            }
        }
    }

    private addMyInformation(simulationPackage: SimulationPackage) {
        simulationPackage.data.hops.push({
            toNode: this.name,
            cost: simulationPackage.lastCost
        });
        simulationPackage.data.hops = [...simulationPackage.data.hops];
        return simulationPackage;
    }

    private handleReturnedInformationPackage(simulationPackage: SimulationPackage) {
        if()
    }
}


class SpanTreeNode {
    // name
    // value


    // networking
    // send information package through the complete network
    sendInformationRequest() {
        const siblingNodes = this.emitPing();
        siblingNodes.forEach(node => {
            this.emitPackage(new SimulationPackage(
                packageType.INFORMATION,
                {
                    name: this.name,
                    value: this.value,
                    hops: [
                        {
                            node: this,
                            cost: 0
                        }
                    ]
                },
                node
            ));
        });
        this.minimalDiscoveredSpanTree.allNodes.filter(n => n.name !== this.name).forEach(node => {
            this.emitPackage(new SimulationPackage(packageType.MST_SHARE, {mst: this.minimalDiscoveredSpanTree}, this.minimalDiscoveredSpanTree.getNextNodeWhenGoing(this, node), node))
        });
    };

    // gets sibling nodes
    emitPing() {
        return this.network.emitPing();
    }

    // passes the package to the network
    emitPackage(somePackage) {
        console.log(`Node ${this.name} sends a package(${packageTypeNames["" + somePackage.type]}) to ${somePackage.target.name}`);
        this.network.emitPackage(somePackage);
    };

    // appends this nodes information to the information request package
    appendMyInformation(informationPackage, wayCost) {
        informationPackage.data.hops.push({
            node: this,
            cost: wayCost
        });
        informationPackage.data.hops = [...informationPackage.data.hops];
        return informationPackage;
    };

    // process the returned information Package and builds the minimal Spantree
    processReturnedInformation(informationPackage) {
        informationPackage.data.forEach(d => {
            for (let i = 0; i < d.hops.length - 1; i++) {
                const nodes = d.hops.map(h => h.node).slice(i, i + 2);
                const cost = d.hops[i + 1].cost;
                const knownConnectionIndex = this.connections.findIndex(connection => connection.nodes.findIndex(n => n.name === nodes[0].name) !== -1 && connection.nodes.findIndex(n => n.name === nodes[1].name) !== -1);
                if (knownConnectionIndex === -1) {
                    this.connections.push(new SpanTreeLink(nodes, cost));
                }
            }
        });
        this.minimalDiscoveredSpanTree = new MinimalSpanTree(this.connections);
        this.network.emitReceivedInformation({
            informationPackage,
            mst: this.minimalDiscoveredSpanTree,
            node: this
        });

    };

    // receive a package from the network with the cost
    receivePackage(somePackage, wayCost) {
        // handle information type package
        if (somePackage.type === packageType.INFORMATION) {
            this.handleInformationPackage(somePackage, wayCost);
        }
        // handle Return package
        else if (somePackage.type === packageType.RETURN_INFORMATION) {
            this.handleReturnedInformationPackage(somePackage);
        } else if (somePackage.type === packageType.MST_SHARE) {
            this.minimalDiscoveredSpanTree = somePackage.data.mst;
            this.handlePackage(somePackage);
        } else if (somePackage.type === packageType.NORMAL) {
            this.handlePackage(somePackage);
        }
    };

    handleReturnedInformationPackage(somePackage) {
// if it wants to me
        if (somePackage.data[0].hops[0].node.name === this.name) {
            this.processReturnedInformation(somePackage);
        }
        // else let it go back the way it came before it was a Return package
        else {
            let targetIndex = -2;
            let c = -1;
            while (targetIndex < 0) {
                c++;
                targetIndex = somePackage.data[c].hops.findIndex(n => n.node.name === this.name) + 1;
            }

            console.log(`Received IPackage at ${this.name}<=${somePackage.data[c].hops[targetIndex].node.name}`);
            this.countSplits--;
            if (this.countSplits === 0 && !this.queuedReturnInformationPackage) {
                let targetIndex = -2;
                let c = -1;
                while (targetIndex < 0) {
                    c++;
                    targetIndex = somePackage.data[c].hops.findIndex(n => n.node.name === this.name) - 1;
                }
                somePackage.target = somePackage.data[c].hops[targetIndex].node;
                this.emitPackage(somePackage);
            } else {
                if (!this.queuedReturnInformationPackage) {
                    this.queuedReturnInformationPackage = somePackage;
                } else if (this.countSplits === 0) {
                    let targetIndex = -2;
                    let c = -1;
                    while (targetIndex < 0) {
                        c++;
                        targetIndex = this.queuedReturnInformationPackage.data[c].hops.findIndex(n => n.node.name === this.name) - 1;
                    }
                    this.queuedReturnInformationPackage.target = this.queuedReturnInformationPackage.data[c].hops[targetIndex].node;
                    this.emitPackage(this.queuedReturnInformationPackage);
                } else {
                    let arr = somePackage.data.length !== undefined ? [...somePackage.data] : [somePackage.data];
                    this.queuedReturnInformationPackage.data.push(...arr);
                }
            }
        }
    }

    handleInformationPackage(somePackage, wayCost) {

        const siblingNodes = this.emitPing();
        let map = somePackage.data.hops.map(h => h.node.name);
        let isFinished = this.nodeHasSplitted;
        this.nodeHasSplitted = true;
        console.log(map, "   ", this.name);
        let newPackage = {...this.appendMyInformation(somePackage, wayCost)};
        if (isFinished) {
            newPackage = new SimulationPackage(packageType.RETURN_INFORMATION, [newPackage.data], newPackage.data.hops[newPackage.data.hops.length - 2].node);
        }
        if (newPackage.type === packageType.RETURN_INFORMATION) {
            this.emitPackage(newPackage);
        } else
        // send information package to all siblings
        {
            let nextHops = siblingNodes.filter(n => newPackage.data.hops[newPackage.data.hops.length - 2].name !== n.name);

            this.countSplits = nextHops.length;
            if (this.countSplits > 1)
                console.log(`>>>> SPLITS AT ${this.name}`);

            nextHops.forEach(node => {
                if (this.countSplits > 1)
                    console.log(`>>>> SPLIT AT ${this.name}`);
                const p = new SimulationPackage(newPackage.type, {
                    node: {...newPackage.data.node},
                    value: newPackage.data.value,
                    hops: [...newPackage.data.hops]
                }, node);
                this.emitPackage(p);
                if (this.countSplits > 1)

                    console.log(`<<<< SPLIT RETURNED AT ${this.name}`);
            });
            if (this.countSplits > 1)
                console.log(`<<<< ALL SPLITS RETURNED AT ${this.name}`);
        }
    }

    handlePackage(somePackage) {
        if (somePackage.destination.name === this.name) {
            console.log(`${this.name} received following package: `, somePackage);
        } else {
            const newTarget = this.minimalDiscoveredSpanTree.getNextNodeWhenGoing(this, somePackage.destination);
            somePackage.target = newTarget;
            this.emitPackage(somePackage);
        }
    }

    // internal
    setNetwork(packageEmitFunc, pingEmitFunc, addReceivedInfo) {
        this.network = {
            emitPackage: (somePackage) => packageEmitFunc(this, somePackage),
            emitPing: () => pingEmitFunc(this),
            emitReceivedInformation: (packageMst) => addReceivedInfo(packageMst)
        };
    }

    constructor(name, value) {
        this.name = name;
        this.value = value;
        this.countSplits = 0;
        this.nodeHasSplitted = false;
        // known Data
        this.connections = [];
    }


}
