import {SimulationLink} from "../Simulation/SimulationLink";
import * as DisjointSet from "disjoint";

export class MinimalSpanTree {
    public shortestLinks: SimulationLink[] = [];
    public allNodes: { name: string, value: number }[] = [];
    public root: { name: string, value: number };

    constructor(spanTreeLinks: SimulationLink[]) {

        let links = [...spanTreeLinks];
        links = links.sort((a, b) => a.cost - b.cost).reverse();

        const array = links.flatMap(l => l.nodes);

        const map = new Map();
        for (const item of array) {
            if (!map.has(item.name)) {
                map.set(item.name, true);
                this.allNodes.push(item);
            }
        }
        this.root = this.allNodes.sort((a, b) => a.value - b.value)[0];
        this.shortestLinks = this.kruskal(links, links.length);
    }

    linkToString() {
        const sorted = this.shortestLinks.map(link => {
            return new SimulationLink(link.nodes.sort((a, b) => {
                    if (a.name < b.name) {
                        return -1;
                    }
                    if (a.name > b.name) {
                        return 1;
                    }
                    return 0;
                }), link.cost
            );
        }).sort((a, b) => {
            if (a.nodes[0].name < b.nodes[0].name) {
                return -1;
            }
            if (a.nodes[0].name > b.nodes[0].name) {
                return 1;
            }
            if (a.nodes[0].name === b.nodes[0].name) {
                if (a.nodes[1].name < b.nodes[1].name) {
                    return -1;
                }
                if (a.nodes[1].name > b.nodes[1].name) {
                    return 1;
                }
            }
            return 0;
        });
        let ret = "";
        sorted.forEach(link => {
            ret += `${link.nodes[0].name} - ${link.nodes[1].name};\n\t`
        });
        return ret;
    }

    getRoutingTable(name: string) {
        const ret: {
            target: string,
            nextHop: string
        }[] = [];
        this.allNodes.filter(n => n.name !== name).forEach(node => {
            ret.push({
                target: node.name,
                nextHop: this.getNextHop(name, node.name)
            })
        });
        return ret;
    }

    private getNextHop(from: string, to: string, nextHop?: string, dont: string[] = []) {
        console.log(from, to, nextHop);
        dont.push(from);
        const targets = this.shortestLinks.filter(l => l.nodes.findIndex(n => n.name === from) !== -1);
        const containsTo = () => targets.findIndex(t => t.nodes.findIndex(n => n.name === to) !== -1) !== -1;
        if (containsTo()) {
            return !nextHop ? to : nextHop;
        } else {
            for (const target of targets) {
                const n = target.nodes.find(n => n.name !== from).name;
                if (dont.indexOf(n) === -1) {
                    const ret = this.getNextHop(n, to, !nextHop ? n : nextHop, [...dont]);
                    if (!!ret) {
                        return ret;
                    }
                }
            }
        }
    }

    private kruskal(links: SimulationLink[], n: number): SimulationLink[] {
        const linkSet = new DisjointSet(this.allNodes.length);
        const getIndexes = (link) => link.nodes.map(no => this.allNodes.findIndex(node => node.name === no.name));
        const mstLinks: SimulationLink[] = [];
        while (links.length > 0) {
            const link = links.pop();
            if (!linkSet.isConnected(...getIndexes(link))) {
                linkSet.union(...getIndexes(link));
                mstLinks.push(link);
            }
        }
        return mstLinks;
    }
}
